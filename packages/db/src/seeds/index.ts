import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data in reverse dependency order
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.document.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.rFQ.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.portCall.deleteMany();
  await prisma.vesselPosition.deleteMany();
  await prisma.vessel.deleteMany();
  await prisma.port.deleteMany();
  await prisma.serviceType.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log('✅ Cleared existing data');

  // Create operator organization
  const operatorOrg = await prisma.organization.create({
    data: {
      name: 'Navo Maritime Services',
      type: 'operator',
      status: 'active',
      settings: {
        currency: 'USD',
        timezone: 'UTC',
        features: ['portCalls', 'rfq', 'vendors', 'analytics'],
      },
    },
  });
  console.log('✅ Created operator organization');

  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@navo.io',
      passwordHash,
      name: 'Admin User',
      organizationId: operatorOrg.id,
      roles: [{ role: 'admin', scope: {} }],
      status: 'active',
    },
  });
  console.log('✅ Created admin user (admin@navo.io / admin123)');

  // Create operator user
  const operatorUser = await prisma.user.create({
    data: {
      email: 'operator@navo.io',
      passwordHash,
      name: 'John Operator',
      organizationId: operatorOrg.id,
      roles: [{ role: 'operator', scope: {} }],
      status: 'active',
    },
  });

  // Create customer organization
  const customerOrg = await prisma.organization.create({
    data: {
      name: 'Global Shipping Co.',
      type: 'customer',
      status: 'active',
      settings: {},
    },
  });

  // Create workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Global Shipping Fleet',
      organizationId: operatorOrg.id,
      type: 'customer',
      status: 'active',
      settings: {
        customerId: customerOrg.id,
      },
    },
  });
  console.log('✅ Created workspace');

  // Create ports
  const ports = await Promise.all([
    prisma.port.create({
      data: {
        name: 'Port of Singapore',
        unlocode: 'SGSIN',
        country: 'Singapore',
        latitude: 1.2644,
        longitude: 103.8223,
        timezone: 'Asia/Singapore',
        facilities: ['container', 'bunker', 'repair', 'provisions'],
        status: 'active',
      },
    }),
    prisma.port.create({
      data: {
        name: 'Port of Rotterdam',
        unlocode: 'NLRTM',
        country: 'Netherlands',
        latitude: 51.9066,
        longitude: 4.4816,
        timezone: 'Europe/Amsterdam',
        facilities: ['container', 'bulk', 'bunker', 'chemical'],
        status: 'active',
      },
    }),
    prisma.port.create({
      data: {
        name: 'Port of Shanghai',
        unlocode: 'CNSHA',
        country: 'China',
        latitude: 31.2304,
        longitude: 121.4737,
        timezone: 'Asia/Shanghai',
        facilities: ['container', 'bulk', 'chemical'],
        status: 'active',
      },
    }),
    prisma.port.create({
      data: {
        name: 'Port of Houston',
        unlocode: 'USHOU',
        country: 'United States',
        latitude: 29.7604,
        longitude: -95.3698,
        timezone: 'America/Chicago',
        facilities: ['container', 'bulk', 'chemical', 'bunker'],
        status: 'active',
      },
    }),
    prisma.port.create({
      data: {
        name: 'Port of Dubai (Jebel Ali)',
        unlocode: 'AEJEA',
        country: 'United Arab Emirates',
        latitude: 25.0159,
        longitude: 55.0731,
        timezone: 'Asia/Dubai',
        facilities: ['container', 'bulk', 'bunker', 'provisions'],
        status: 'active',
      },
    }),
  ]);
  console.log('✅ Created 5 ports');

  // Create service types
  const serviceTypes = await Promise.all([
    prisma.serviceType.create({
      data: {
        name: 'Bunker Supply',
        category: 'bunker',
        description: 'Marine fuel supply services',
        defaultSpecifications: {
          fuelTypes: ['VLSFO', 'HSFO', 'MGO'],
        },
        status: 'active',
      },
    }),
    prisma.serviceType.create({
      data: {
        name: 'Fresh Water Supply',
        category: 'provisions',
        description: 'Potable water supply to vessels',
        defaultSpecifications: {
          unit: 'MT',
        },
        status: 'active',
      },
    }),
    prisma.serviceType.create({
      data: {
        name: 'Provisions Supply',
        category: 'provisions',
        description: 'Food and consumables supply',
        defaultSpecifications: {},
        status: 'active',
      },
    }),
    prisma.serviceType.create({
      data: {
        name: 'Waste Disposal',
        category: 'environmental',
        description: 'Garbage and waste collection',
        defaultSpecifications: {
          wasteTypes: ['garbage', 'oily', 'sludge'],
        },
        status: 'active',
      },
    }),
    prisma.serviceType.create({
      data: {
        name: 'Repairs - Hull',
        category: 'repairs',
        description: 'Hull repair and maintenance',
        defaultSpecifications: {},
        status: 'active',
      },
    }),
    prisma.serviceType.create({
      data: {
        name: 'Repairs - Engine',
        category: 'repairs',
        description: 'Engine and machinery repairs',
        defaultSpecifications: {},
        status: 'active',
      },
    }),
    prisma.serviceType.create({
      data: {
        name: 'Crew Change',
        category: 'crew',
        description: 'Crew embarkation/disembarkation services',
        defaultSpecifications: {},
        status: 'active',
      },
    }),
    prisma.serviceType.create({
      data: {
        name: 'Spare Parts Delivery',
        category: 'logistics',
        description: 'Spare parts and equipment delivery',
        defaultSpecifications: {},
        status: 'active',
      },
    }),
    prisma.serviceType.create({
      data: {
        name: 'Agency Services',
        category: 'agency',
        description: 'Port agency and husbandry services',
        defaultSpecifications: {},
        status: 'active',
      },
    }),
    prisma.serviceType.create({
      data: {
        name: 'Survey/Inspection',
        category: 'inspection',
        description: 'Class and flag state surveys',
        defaultSpecifications: {},
        status: 'active',
      },
    }),
  ]);
  console.log('✅ Created 10 service types');

  // Create vessels
  const vessels = await Promise.all([
    prisma.vessel.create({
      data: {
        name: 'MV Pacific Star',
        imo: '9876543',
        mmsi: '123456789',
        flag: 'Panama',
        type: 'container',
        details: {
          dwt: 65000,
          loa: 300,
          beam: 40,
          draft: 14.5,
          built: 2018,
          class: 'Lloyd\'s Register',
        },
        workspaceId: workspace.id,
        status: 'active',
      },
    }),
    prisma.vessel.create({
      data: {
        name: 'MV Atlantic Voyager',
        imo: '9876544',
        mmsi: '123456790',
        flag: 'Liberia',
        type: 'bulk_carrier',
        details: {
          dwt: 82000,
          loa: 229,
          beam: 32,
          draft: 14.2,
          built: 2020,
          class: 'DNV',
        },
        workspaceId: workspace.id,
        status: 'active',
      },
    }),
    prisma.vessel.create({
      data: {
        name: 'MT Gulf Trader',
        imo: '9876545',
        mmsi: '123456791',
        flag: 'Marshall Islands',
        type: 'tanker',
        details: {
          dwt: 115000,
          loa: 274,
          beam: 48,
          draft: 16.5,
          built: 2019,
          class: 'ABS',
        },
        workspaceId: workspace.id,
        status: 'active',
      },
    }),
  ]);
  console.log('✅ Created 3 vessels');

  // Create vendor organizations and vendors
  const vendorOrg1 = await prisma.organization.create({
    data: {
      name: 'Marine Fuel Solutions Pte Ltd',
      type: 'vendor',
      status: 'active',
      settings: {},
    },
  });

  const vendorOrg2 = await prisma.organization.create({
    data: {
      name: 'Port Services International',
      type: 'vendor',
      status: 'active',
      settings: {},
    },
  });

  const vendors = await Promise.all([
    prisma.vendor.create({
      data: {
        name: 'Marine Fuel Solutions',
        organizationId: vendorOrg1.id,
        registrationNumber: 'SG-VEN-001',
        address: {
          street: '10 Marina Boulevard',
          city: 'Singapore',
          postalCode: '018983',
          country: 'Singapore',
        },
        contacts: [
          { name: 'Alice Wong', role: 'Sales Manager', email: 'alice@marinefuel.sg', phone: '+65 9123 4567' },
        ],
        bankDetails: {},
        serviceTypes: [serviceTypes[0].id, serviceTypes[1].id],
        ports: [ports[0].id, ports[4].id],
        certifications: ['ISO 9001', 'MARPOL Compliant'],
        rating: 4.5,
        totalOrders: 156,
        onTimeDelivery: 96.5,
        responseTime: 2.3,
        status: 'verified',
        verifiedAt: new Date(),
      },
    }),
    prisma.vendor.create({
      data: {
        name: 'Port Services International',
        organizationId: vendorOrg2.id,
        registrationNumber: 'NL-VEN-002',
        address: {
          street: 'Waalhaven Z.Z. 5',
          city: 'Rotterdam',
          postalCode: '3089 JH',
          country: 'Netherlands',
        },
        contacts: [
          { name: 'Jan de Vries', role: 'Operations', email: 'jan@portservices.nl', phone: '+31 10 123 4567' },
        ],
        bankDetails: {},
        serviceTypes: [serviceTypes[2].id, serviceTypes[3].id, serviceTypes[6].id],
        ports: [ports[1].id],
        certifications: ['ISO 14001'],
        rating: 4.2,
        totalOrders: 89,
        onTimeDelivery: 94.0,
        responseTime: 3.1,
        status: 'verified',
        verifiedAt: new Date(),
      },
    }),
  ]);
  console.log('✅ Created 2 vendors');

  // Create agent organization and agent
  const agentOrg = await prisma.organization.create({
    data: {
      name: 'Singapore Maritime Agency',
      type: 'agent',
      status: 'active',
      settings: {},
    },
  });

  const agent = await prisma.agent.create({
    data: {
      name: 'Singapore Maritime Agency',
      organizationId: agentOrg.id,
      address: {
        street: '50 Collyer Quay',
        city: 'Singapore',
        postalCode: '049321',
        country: 'Singapore',
      },
      contacts: [
        { name: 'David Tan', role: 'Port Captain', email: 'david@sgagency.com', phone: '+65 9876 5432' },
      ],
      ports: [ports[0].id],
      services: ['husbandry', 'clearance', 'berthing'],
      rating: 4.8,
      totalCalls: 234,
      responseTime: 1.5,
      status: 'active',
    },
  });
  console.log('✅ Created 1 agent');

  // Generate reference number helper
  const generateRef = (prefix: string, num: number) => {
    const year = new Date().getFullYear().toString().slice(-2);
    return `${prefix}-${year}-${String(num).padStart(4, '0')}`;
  };

  // Create port calls
  const now = new Date();
  const portCalls = await Promise.all([
    // Upcoming port call - Singapore
    prisma.portCall.create({
      data: {
        reference: generateRef('PC', 1),
        vesselId: vessels[0].id,
        portId: ports[0].id,
        workspaceId: workspace.id,
        status: 'confirmed',
        eta: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // +2 days
        etd: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), // +4 days
        berthName: 'Berth 12',
        berthTerminal: 'PSA Terminal',
        berthConfirmedAt: new Date(),
        agentId: agent.id,
        createdBy: operatorUser.id,
      },
    }),
    // In progress - Rotterdam
    prisma.portCall.create({
      data: {
        reference: generateRef('PC', 2),
        vesselId: vessels[1].id,
        portId: ports[1].id,
        workspaceId: workspace.id,
        status: 'alongside',
        eta: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        etd: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        ata: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        berthName: 'Euromax Berth 3',
        berthTerminal: 'Euromax Terminal',
        createdBy: operatorUser.id,
      },
    }),
    // Planned - Dubai
    prisma.portCall.create({
      data: {
        reference: generateRef('PC', 3),
        vesselId: vessels[2].id,
        portId: ports[4].id,
        workspaceId: workspace.id,
        status: 'planned',
        eta: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
        etd: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // +10 days
        createdBy: operatorUser.id,
      },
    }),
    // Draft - Houston
    prisma.portCall.create({
      data: {
        reference: generateRef('PC', 4),
        vesselId: vessels[0].id,
        portId: ports[3].id,
        workspaceId: workspace.id,
        status: 'draft',
        eta: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // +14 days
        etd: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000), // +17 days
        createdBy: adminUser.id,
      },
    }),
    // Completed - Shanghai
    prisma.portCall.create({
      data: {
        reference: generateRef('PC', 5),
        vesselId: vessels[1].id,
        portId: ports[2].id,
        workspaceId: workspace.id,
        status: 'completed',
        eta: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        etd: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        ata: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        atd: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        berthName: 'Yangshan T4',
        berthTerminal: 'Yangshan Deep Water Port',
        createdBy: operatorUser.id,
      },
    }),
  ]);
  console.log('✅ Created 5 port calls');

  // Create service orders for the port calls
  const serviceOrders = await Promise.all([
    // Services for Singapore port call
    prisma.serviceOrder.create({
      data: {
        portCallId: portCalls[0].id,
        serviceTypeId: serviceTypes[0].id, // Bunker
        status: 'confirmed',
        description: 'VLSFO supply',
        quantity: 500,
        unit: 'MT',
        specifications: { fuelType: 'VLSFO', sulfur: '0.5%' },
        requestedDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        confirmedDate: new Date(),
        vendorId: vendors[0].id,
        quotedPrice: 325000,
        currency: 'USD',
        createdBy: operatorUser.id,
      },
    }),
    prisma.serviceOrder.create({
      data: {
        portCallId: portCalls[0].id,
        serviceTypeId: serviceTypes[1].id, // Fresh Water
        status: 'requested',
        description: 'Potable water supply',
        quantity: 200,
        unit: 'MT',
        specifications: {},
        requestedDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        createdBy: operatorUser.id,
      },
    }),
    // Services for Rotterdam port call (current)
    prisma.serviceOrder.create({
      data: {
        portCallId: portCalls[1].id,
        serviceTypeId: serviceTypes[2].id, // Provisions
        status: 'in_progress',
        description: 'Provisions resupply for 25 crew',
        quantity: 1,
        unit: 'lot',
        specifications: {},
        requestedDate: new Date(),
        confirmedDate: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        vendorId: vendors[1].id,
        quotedPrice: 8500,
        currency: 'EUR',
        createdBy: operatorUser.id,
      },
    }),
    prisma.serviceOrder.create({
      data: {
        portCallId: portCalls[1].id,
        serviceTypeId: serviceTypes[3].id, // Waste
        status: 'completed',
        description: 'Garbage and sludge disposal',
        quantity: 15,
        unit: 'CBM',
        specifications: { wasteType: 'sludge' },
        requestedDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        confirmedDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        completedDate: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        vendorId: vendors[1].id,
        quotedPrice: 2200,
        finalPrice: 2200,
        currency: 'EUR',
        createdBy: operatorUser.id,
      },
    }),
  ]);
  console.log('✅ Created 4 service orders');

  // Create RFQ
  const rfq = await prisma.rFQ.create({
    data: {
      reference: generateRef('RFQ', 1),
      serviceTypeId: serviceTypes[0].id,
      portCallId: portCalls[2].id,
      status: 'sent',
      description: 'VLSFO supply for MT Gulf Trader',
      quantity: 800,
      unit: 'MT',
      specifications: { fuelType: 'VLSFO', sulfur: '0.5%' },
      deliveryDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      deadline: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      invitedVendors: [vendors[0].id],
      createdBy: operatorUser.id,
    },
  });
  console.log('✅ Created 1 RFQ');

  // Create a quote for the RFQ
  await prisma.quote.create({
    data: {
      rfqId: rfq.id,
      vendorId: vendors[0].id,
      status: 'submitted',
      unitPrice: 650,
      totalPrice: 520000,
      currency: 'USD',
      paymentTerms: 'Net 30',
      deliveryDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      validUntil: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      notes: 'Price includes delivery alongside. Quantity tolerance +/- 5%.',
      attachments: [],
    },
  });
  console.log('✅ Created 1 quote');

  // Create some notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: operatorUser.id,
        type: 'quote_received',
        title: 'New Quote Received',
        message: `Quote received from Marine Fuel Solutions for RFQ ${rfq.reference}`,
        data: { rfqId: rfq.id },
        link: `/rfqs/${rfq.id}`,
        channels: ['in_app', 'email'],
      },
    }),
    prisma.notification.create({
      data: {
        userId: adminUser.id,
        type: 'port_call_created',
        title: 'Port Call Scheduled',
        message: `New port call ${portCalls[0].reference} scheduled for MV Pacific Star at Singapore`,
        data: { portCallId: portCalls[0].id },
        link: `/port-calls/${portCalls[0].id}`,
        channels: ['in_app'],
      },
    }),
  ]);
  console.log('✅ Created 2 notifications');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📋 Summary:');
  console.log('  - 1 operator organization');
  console.log('  - 2 users (admin@navo.io, operator@navo.io)');
  console.log('  - 1 workspace');
  console.log('  - 5 ports');
  console.log('  - 10 service types');
  console.log('  - 3 vessels');
  console.log('  - 2 vendors');
  console.log('  - 1 agent');
  console.log('  - 5 port calls');
  console.log('  - 4 service orders');
  console.log('  - 1 RFQ with 1 quote');
  console.log('\n🔑 Login credentials:');
  console.log('  - Email: admin@navo.io');
  console.log('  - Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
