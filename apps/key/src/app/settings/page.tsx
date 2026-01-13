'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Separator,
  Badge,
} from '@navo/ui';
import {
  User,
  Building2,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Moon,
  Sun,
  Mail,
  Smartphone,
  Key,
  Users,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';

const teamMembers = [
  { id: '1', name: 'John Operator', email: 'operator@navo.io', role: 'Admin', status: 'active' },
  { id: '2', name: 'Sarah Manager', email: 'sarah@navo.io', role: 'Manager', status: 'active' },
  { id: '3', name: 'Mike Analyst', email: 'mike@navo.io', role: 'Viewer', status: 'active' },
  { id: '4', name: 'Lisa Operations', email: 'lisa@navo.io', role: 'Operator', status: 'pending' },
];

export default function SettingsPage() {
  const [theme, setTheme] = useState('system');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Personal Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">First Name</label>
                <Input defaultValue="John" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Last Name</label>
                <Input defaultValue="Operator" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">Email</label>
                <Input type="email" defaultValue="operator@navo.io" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">Phone</label>
                <Input type="tel" defaultValue="+65 9123 4567" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">Select your preferred theme</p>
                </div>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Language</p>
                  <p className="text-sm text-muted-foreground">Select your language</p>
                </div>
                <Select defaultValue="en">
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Timezone</p>
                  <p className="text-sm text-muted-foreground">Set your local timezone</p>
                </div>
                <Select defaultValue="sg">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sg">Asia/Singapore (GMT+8)</SelectItem>
                    <SelectItem value="lon">Europe/London (GMT+0)</SelectItem>
                    <SelectItem value="ny">America/New_York (GMT-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Security</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Key className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                  </div>
                </div>
                <Button variant="outline">Change Password</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                </div>
                <Button variant="outline">Enable</Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization" className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Organization Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">Organization Name</label>
                <Input defaultValue="Pacific Shipping Co." />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Industry</label>
                <Select defaultValue="shipping">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shipping">Shipping & Logistics</SelectItem>
                    <SelectItem value="offshore">Offshore & Energy</SelectItem>
                    <SelectItem value="cruise">Cruise & Passenger</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Company Size</label>
                <Select defaultValue="50-200">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="50-200">50-200 employees</SelectItem>
                    <SelectItem value="200+">200+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">Address</label>
                <Input defaultValue="1 Maritime Square, Singapore 099253" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Billing</h3>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Pro Plan</p>
                  <p className="text-sm text-muted-foreground">$299/month · Renews Jan 15, 2026</p>
                </div>
              </div>
              <Button variant="outline">Manage Subscription</Button>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Email Notifications</h3>
            <div className="space-y-4">
              {[
                { title: 'Port Call Updates', description: 'Get notified when port call status changes' },
                { title: 'New Quotes', description: 'Receive alerts when vendors submit quotes' },
                { title: 'Service Reminders', description: 'Upcoming service delivery reminders' },
                { title: 'Weekly Summary', description: 'Weekly digest of your operations' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 rounded border-gray-300"
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Push Notifications</h3>
            <div className="space-y-4">
              {[
                { title: 'Urgent Alerts', description: 'Critical updates requiring immediate attention' },
                { title: 'Chat Messages', description: 'New messages from vendors or team' },
                { title: 'Deadline Reminders', description: 'RFQ and service deadline alerts' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={i === 0}
                    className="h-5 w-5 rounded border-gray-300"
                  />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Team Members</h3>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </div>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {member.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.name}</p>
                        {member.status === 'pending' && (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                            Pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Select defaultValue={member.role.toLowerCase()}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="operator">Operator</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Role Permissions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Permission</th>
                    <th className="pb-3 text-center font-medium">Admin</th>
                    <th className="pb-3 text-center font-medium">Manager</th>
                    <th className="pb-3 text-center font-medium">Operator</th>
                    <th className="pb-3 text-center font-medium">Viewer</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    { permission: 'View all data', admin: true, manager: true, operator: true, viewer: true },
                    { permission: 'Create port calls', admin: true, manager: true, operator: true, viewer: false },
                    { permission: 'Approve quotes', admin: true, manager: true, operator: false, viewer: false },
                    { permission: 'Manage vendors', admin: true, manager: true, operator: false, viewer: false },
                    { permission: 'Manage team', admin: true, manager: false, operator: false, viewer: false },
                    { permission: 'Billing & settings', admin: true, manager: false, operator: false, viewer: false },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="py-3">{row.permission}</td>
                      <td className="py-3 text-center">{row.admin ? '✓' : '-'}</td>
                      <td className="py-3 text-center">{row.manager ? '✓' : '-'}</td>
                      <td className="py-3 text-center">{row.operator ? '✓' : '-'}</td>
                      <td className="py-3 text-center">{row.viewer ? '✓' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
