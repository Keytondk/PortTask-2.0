import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { id: 'org_demo' },
    update: {},
    create: {
      id: 'org_demo',
      name: 'Navo Maritime',
      type: 'operator',
      status: 'active',
      settings: {
        timezone: 'Asia/Singapore',
        currency: 'USD',
        features: {
          rfq: true,
          vesselTracking: true,
          analytics: true,
        },
      },
    },
  });

  console.log('✓ Organization created:', org.name);

  // Create demo user
  const passwordHash = await hash('demo123456', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@navo.io' },
    update: {},
    create: {
      email: 'demo@navo.io',
      passwordHash,
      name: 'Demo User',
      organizationId: org.id,
      roles: ['admin', 'operator'],
      status: 'active',
    },
  });

  console.log('✓ User created:', user.email);

  // Create demo workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: 'ws_demo' },
    update: {},
    create: {
      id: 'ws_demo',
      name: 'Singapore Operations',
      organizationId: org.id,
      type: 'internal',
      status: 'active',
      settings: {
        defaultPort: 'SGSIN',
        defaultCurrency: 'USD',
      },
    },
  });

  console.log('✓ Workspace created:', workspace.name);

  // Link user to workspace
  await prisma.userWorkspace.upsert({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: 'admin',
    },
  });

  console.log('✓ User linked to workspace');

  // Create demo ports
  const ports = await Promise.all([
    prisma.port.upsert({
      where: { unlocode: 'SGSIN' },
      update: {},
      create: {
        name: 'Singapore',
        unlocode: 'SGSIN',
        country: 'Singapore',
        latitude: 1.2644,
        longitude: 103.8200,
        timezone: 'Asia/Singapore',
        facilities: ['container', 'bunker', 'repairs'],
      },
    }),
    prisma.port.upsert({
      where: { unlocode: 'MYPKG' },
      update: {},
      create: {
        name: 'Port Klang',
        unlocode: 'MYPKG',
        country: 'Malaysia',
        latitude: 3.0000,
        longitude: 101.4000,
        timezone: 'Asia/Kuala_Lumpur',
        facilities: ['container', 'bulk'],
      },
    }),
    prisma.port.upsert({
      where: { unlocode: 'HKHKG' },
      update: {},
      create: {
        name: 'Hong Kong',
        unlocode: 'HKHKG',
        country: 'Hong Kong',
        latitude: 22.2855,
        longitude: 114.1577,
        timezone: 'Asia/Hong_Kong',
        facilities: ['container', 'bunker', 'repairs'],
      },
    }),
  ]);

  console.log('✓ Ports created:', ports.length);

  // Create demo vessels
  const vessels = await Promise.all([
    prisma.vessel.upsert({
      where: { imo: '9876543' },
      update: {},
      create: {
        name: 'MV Pacific Explorer',
        imo: '9876543',
        mmsi: '123456789',
        flag: 'SG',
        type: 'container',
        workspaceId: workspace.id,
        details: {
          dwt: 50000,
          loa: 280,
          beam: 40,
          draft: 12,
        },
      },
    }),
    prisma.vessel.upsert({
      where: { imo: '9876544' },
      update: {},
      create: {
        name: 'MV Ocean Voyager',
        imo: '9876544',
        mmsi: '123456790',
        flag: 'PA',
        type: 'bulk',
        workspaceId: workspace.id,
        details: {
          dwt: 75000,
          loa: 230,
          beam: 32,
          draft: 14,
        },
      },
    }),
    prisma.vessel.upsert({
      where: { imo: '9876545' },
      update: {},
      create: {
        name: 'MT Horizon Star',
        imo: '9876545',
        mmsi: '123456791',
        flag: 'LR',
        type: 'tanker',
        workspaceId: workspace.id,
        details: {
          dwt: 100000,
          loa: 250,
          beam: 44,
          draft: 16,
        },
      },
    }),
  ]);

  console.log('✓ Vessels created:', vessels.length);

  // Create demo port call
  const portCall = await prisma.portCall.upsert({
    where: { reference: 'PC-2026-0001' },
    update: {},
    create: {
      reference: 'PC-2026-0001',
      vesselId: vessels[0].id,
      portId: ports[0].id,
      workspaceId: workspace.id,
      status: 'confirmed',
      eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      etd: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
      berthName: 'Berth 12',
      berthTerminal: 'PSA Terminal',
      createdBy: user.id,
    },
  });

  console.log('✓ Port call created:', portCall.reference);

  // Create service types
  const serviceTypes = await Promise.all([
    prisma.serviceType.upsert({
      where: { id: 'st_bunker' },
      update: {},
      create: {
        id: 'st_bunker',
        name: 'Bunkering',
        category: 'fuel',
        description: 'Fuel supply services',
      },
    }),
    prisma.serviceType.upsert({
      where: { id: 'st_provisions' },
      update: {},
      create: {
        id: 'st_provisions',
        name: 'Provisions',
        category: 'supplies',
        description: 'Food and supplies for crew',
      },
    }),
    prisma.serviceType.upsert({
      where: { id: 'st_repairs' },
      update: {},
      create: {
        id: 'st_repairs',
        name: 'Ship Repairs',
        category: 'maintenance',
        description: 'Ship repair and maintenance services',
      },
    }),
  ]);

  console.log('✓ Service types created:', serviceTypes.length);

  // Create demo vendor organization
  const vendorOrg = await prisma.organization.upsert({
    where: { id: 'org_vendor_demo' },
    update: {},
    create: {
      id: 'org_vendor_demo',
      name: 'Singapore Marine Services Pte Ltd',
      type: 'vendor',
      status: 'active',
    },
  });

  // Create demo vendor
  const vendor = await prisma.vendor.upsert({
    where: { id: 'vendor_demo' },
    update: {},
    create: {
      id: 'vendor_demo',
      name: 'Singapore Marine Services',
      organizationId: vendorOrg.id,
      serviceTypes: ['st_bunker', 'st_provisions'],
      ports: ['SGSIN', 'MYPKG'],
      status: 'active',
      rating: 4.5,
      isVerified: true,
      verifiedAt: new Date(),
      address: {
        street: '1 Marina Boulevard',
        city: 'Singapore',
        country: 'Singapore',
        postalCode: '018989',
      },
      contacts: [
        {
          name: 'Operations Manager',
          email: 'ops@sms-marine.com',
          phone: '+65 6123 4567',
        },
      ],
    },
  });

  console.log('✓ Vendor created:', vendor.name);

  // Create feature flags
  const flags = await Promise.all([
    prisma.featureFlag.upsert({
      where: { key: 'rfq_enabled' },
      update: {},
      create: {
        key: 'rfq_enabled',
        name: 'RFQ System',
        description: 'Enable Request for Quote functionality',
        defaultValue: true,
      },
    }),
    prisma.featureFlag.upsert({
      where: { key: 'vessel_tracking_enabled' },
      update: {},
      create: {
        key: 'vessel_tracking_enabled',
        name: 'Vessel Tracking',
        description: 'Enable real-time vessel tracking',
        defaultValue: true,
      },
    }),
    prisma.featureFlag.upsert({
      where: { key: 'analytics_enabled' },
      update: {},
      create: {
        key: 'analytics_enabled',
        name: 'Analytics Dashboard',
        description: 'Enable analytics and reporting',
        defaultValue: false,
      },
    }),
  ]);

  console.log('✓ Feature flags created:', flags.length);

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('Demo credentials:');
  console.log('  Email: demo@navo.io');
  console.log('  Password: demo123456');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
