package scheduler

import (
	"context"
	"sync"
	"time"

	"github.com/navo/pkg/logger"
	"go.uber.org/zap"
)

// Job represents a background job
type Job interface {
	Name() string
	Run(ctx context.Context) error
}

// ScheduledJob wraps a job with scheduling information
type ScheduledJob struct {
	Job      Job
	Interval time.Duration
	LastRun  time.Time
	NextRun  time.Time
	Running  bool
}

// Scheduler manages background jobs
type Scheduler struct {
	jobs           map[string]*ScheduledJob
	stopCh         chan struct{}
	wg             sync.WaitGroup
	mu             sync.RWMutex
	maxConcurrent  int
	semaphore      chan struct{}
	jobTimeout     time.Duration
}

// NewScheduler creates a new scheduler
func NewScheduler(maxConcurrent int, jobTimeout time.Duration) *Scheduler {
	return &Scheduler{
		jobs:          make(map[string]*ScheduledJob),
		stopCh:        make(chan struct{}),
		maxConcurrent: maxConcurrent,
		semaphore:     make(chan struct{}, maxConcurrent),
		jobTimeout:    jobTimeout,
	}
}

// RegisterJob registers a job with the scheduler
func (s *Scheduler) RegisterJob(job Job, interval time.Duration) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.jobs[job.Name()] = &ScheduledJob{
		Job:      job,
		Interval: interval,
		NextRun:  time.Now().Add(interval),
	}

	logger.Info("Registered job",
		zap.String("job", job.Name()),
		zap.Duration("interval", interval),
	)
}

// RegisterImmediateJob registers and runs a job immediately
func (s *Scheduler) RegisterImmediateJob(job Job, interval time.Duration) {
	s.mu.Lock()
	s.jobs[job.Name()] = &ScheduledJob{
		Job:      job,
		Interval: interval,
		NextRun:  time.Now(), // Run immediately
	}
	s.mu.Unlock()

	logger.Info("Registered immediate job",
		zap.String("job", job.Name()),
		zap.Duration("interval", interval),
	)
}

// Start starts the scheduler
func (s *Scheduler) Start() {
	s.wg.Add(1)
	go s.run()
	logger.Info("Scheduler started", zap.Int("max_concurrent", s.maxConcurrent))
}

// Stop gracefully stops the scheduler
func (s *Scheduler) Stop() {
	close(s.stopCh)
	s.wg.Wait()
	logger.Info("Scheduler stopped")
}

// run is the main scheduler loop
func (s *Scheduler) run() {
	defer s.wg.Done()

	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-s.stopCh:
			return
		case <-ticker.C:
			s.checkAndRunJobs()
		}
	}
}

// checkAndRunJobs checks which jobs need to run and starts them
func (s *Scheduler) checkAndRunJobs() {
	now := time.Now()

	s.mu.RLock()
	jobsToRun := make([]*ScheduledJob, 0)
	for _, sj := range s.jobs {
		if !sj.Running && now.After(sj.NextRun) {
			jobsToRun = append(jobsToRun, sj)
		}
	}
	s.mu.RUnlock()

	for _, sj := range jobsToRun {
		s.runJob(sj)
	}
}

// runJob executes a scheduled job
func (s *Scheduler) runJob(sj *ScheduledJob) {
	// Try to acquire semaphore (non-blocking)
	select {
	case s.semaphore <- struct{}{}:
		// Got slot, proceed
	default:
		// No slots available, skip this run
		logger.Debug("Skipping job, max concurrent reached", zap.String("job", sj.Job.Name()))
		return
	}

	s.mu.Lock()
	sj.Running = true
	s.mu.Unlock()

	s.wg.Add(1)
	go func() {
		defer s.wg.Done()
		defer func() { <-s.semaphore }()
		defer func() {
			s.mu.Lock()
			sj.Running = false
			sj.LastRun = time.Now()
			sj.NextRun = time.Now().Add(sj.Interval)
			s.mu.Unlock()
		}()

		// Create context with timeout
		ctx, cancel := context.WithTimeout(context.Background(), s.jobTimeout)
		defer cancel()

		start := time.Now()
		logger.Debug("Starting job", zap.String("job", sj.Job.Name()))

		if err := sj.Job.Run(ctx); err != nil {
			logger.Error("Job failed",
				zap.String("job", sj.Job.Name()),
				zap.Error(err),
				zap.Duration("duration", time.Since(start)),
			)
		} else {
			logger.Debug("Job completed",
				zap.String("job", sj.Job.Name()),
				zap.Duration("duration", time.Since(start)),
			)
		}
	}()
}

// RunNow runs a job immediately by name
func (s *Scheduler) RunNow(jobName string) error {
	s.mu.RLock()
	sj, ok := s.jobs[jobName]
	s.mu.RUnlock()

	if !ok {
		return nil
	}

	if sj.Running {
		return nil
	}

	s.runJob(sj)
	return nil
}

// GetJobStatus returns the status of all jobs
func (s *Scheduler) GetJobStatus() map[string]map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	status := make(map[string]map[string]interface{})
	for name, sj := range s.jobs {
		status[name] = map[string]interface{}{
			"interval": sj.Interval.String(),
			"last_run": sj.LastRun,
			"next_run": sj.NextRun,
			"running":  sj.Running,
		}
	}
	return status
}
