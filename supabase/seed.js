// supabase/seed.js
import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function seed() {
  console.log('Seeding database...');

  // Clear existing data (optional, for development)
  // await supabase.from('appointments').delete();
  // await supabase.from('slots').delete();
  // ... and so on for all tables in reverse dependency order

  // Create an auth user first
  const { data: authUserData, error: authError } = await supabase.auth.admin.createUser({
    email: faker.internet.email(),
    password: 'password', // A dummy password for seeding
    email_confirm: true,
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    return;
  }
  const authUserId = authUserData.user.id;
  console.log('Created auth user with ID:', authUserId);

  // Seed Users (owner of the salon)
  // In a real scenario, this user would come from Supabase Auth
  // For seeding, we'll create a dummy user in our public.users table
  const ownerId = authUserId; // Use the ID from the newly created auth user

  const { data: userUpdateData, error: userUpdateError } = await supabase
    .from('users')
    .update({
      full_name: faker.person.fullName(),
      phone: faker.phone.number(),
      // salon_id will be linked after salon creation
    })
    .eq('id', ownerId) // Update the user with the given ID
    .select();

  if (userUpdateError) {
    console.error('Error updating users:', userUpdateError);
    return;
  }
  const user = userUpdateData[0];
  console.log('Updated user:', user.full_name);

  // Seed Salons
  const { data: salonData, error: salonError } = await supabase
    .from('salons')
    .insert([
      {
        name: faker.company.name(),
        owner_id: user.id, // Link to the newly created user ID
        plan_type: 'profissional',
        address: faker.location.streetAddress(),
        cep: faker.location.zipCode(),
        phone: faker.phone.number(),
        opening_time: '09:00',
        closing_time: '18:00',
        slot_interval: 30,
        min_booking_hours: 1,
        description: faker.lorem.paragraph(),
        theme_name: 'azure-minimalist',
      },
    ])
    .select();

  if (salonError) {
    console.error('Error seeding salons:', salonError);
    return;
  }
  const salon = salonData[0];
  console.log('Seeded salon:', salon.name);

  // Update the user with the salon_id
  await supabase.from('users').update({ salon_id: salon.id }).eq('id', user.id);
  console.log('Updated user with salon_id.');

  // Seed salon_users (linking the owner)
  const { data: salonUserData, error: salonUserError } = await supabase
    .from('salon_users')
    .insert([
      {
        user_id: user.id,
        salon_id: salon.id,
        role: 'owner',
      },
    ])
    .select();

  if (salonUserError) {
    console.error('Error seeding salon_users:', salonUserError);
    return;
  }
  console.log('Seeded salon_user for owner:', salonUserData[0].user_id);

  // Seed Professionals
  const professionals = [];
  for (let i = 0; i < 3; i++) {
    const { data: professionalData, error: professionalError } = await supabase
      .from('professionals')
      .insert([
        {
          name: faker.person.fullName(),
          salon_id: salon.id,
          specialty: faker.person.jobTitle(),
          commission_rate: faker.number.float({ min: 0.1, max: 0.5, precision: 0.01 }),
          bio: faker.lorem.sentence(),
          active: true,
          avatar_url: faker.image.avatar(),
        },
      ])
      .select();

    if (professionalError) {
      console.error('Error seeding professionals:', professionalError);
      return;
    }
    professionals.push(professionalData[0]);
    console.log('Seeded professional:', professionalData[0].name);
  }

  // Seed Services
  const services = [];
  for (let i = 0; i < 5; i++) {
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .insert([
        {
          name: faker.commerce.productName(),
          salon_id: salon.id,
          duration_minutes: faker.number.int({ min: 30, max: 120, precision: 10 }),
          price: faker.number.float({ min: 50, max: 500, precision: 2 }),
          image_url: faker.image.url(),
        },
      ])
      .select();

    if (serviceError) {
      console.error('Error seeding services:', serviceError);
      return;
    }
    services.push(serviceData[0]);
    console.log('Seeded service:', serviceData[0].name);
  }

  // Seed Professional Services
  for (const professional of professionals) {
    const assignedServiceIds = new Set();
    const numberOfServicesToAssign = faker.number.int({ min: 1, max: Math.min(3, services.length) });

    for (let i = 0; i < numberOfServicesToAssign; i++) {
      let service = null;
      // Keep trying to find a unique service if a duplicate is picked
      let attempts = 0;
      const maxAttempts = services.length; // Prevent infinite loop if services array is small
      while ((!service || assignedServiceIds.has(service.id)) && attempts < maxAttempts) {
        service = faker.helpers.arrayElement(services);
        attempts++;
      }

      if (!service || assignedServiceIds.has(service.id)) {
        // If unable to find a unique service after max attempts, break
        console.warn(`Could not assign unique service to professional ${professional.id}`);
        break;
      }
      
      assignedServiceIds.add(service.id);

      const { error } = await supabase.from('professional_services').insert([
        {
          professional_id: professional.id,
          service_id: service.id,
        },
      ]);
      if (error) {
        console.error('Error seeding professional_services:', error);
        return;
      }
    }
  }
  console.log('Seeded professional_services.');

  // Seed Professional Work Hours
  for (const professional of professionals) {
    for (let weekday = 0; weekday < 7; weekday++) {
      const { error } = await supabase.from('professional_work_hours').insert([
        {
          professional_id: professional.id,
          weekday: weekday,
          start_time: '09:00',
          end_time: '18:00',
        },
      ]);
      if (error) {
        console.error('Error seeding professional_work_hours:', error);
        return;
      }
    }
  }
  console.log('Seeded professional_work_hours.');

  // Seed Products
  const products = [];
  for (let i = 0; i < 5; i++) {
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert([
        {
          name: faker.commerce.product(),
          salon_id: salon.id,
          price: faker.number.float({ min: 10, max: 200, precision: 2 }),
          stock: faker.number.int({ min: 5, max: 50 }),
          min_stock: faker.number.int({ min: 1, max: 5 }),
          commission_rate: faker.number.float({ min: 0.05, max: 0.2, precision: 0.01 }),
        },
      ])
      .select();

    if (productError) {
      console.error('Error seeding products:', productError);
      return;
    }
    products.push(productData[0]);
    console.log('Seeded product:', productData[0].name);
  }

  // Seed Slots (for future appointments)
  const slots = [];
  for (const professional of professionals) {
    for (let day = 0; day < 7; day++) {
      // Seed slots for the next week
      const date = faker.date.future({ years: 1, refDate: new Date() });
      date.setDate(date.getDate() + day);

      let currentHour = 9;
      let currentMinute = 0;
      while (currentHour < 18 || (currentHour === 18 && currentMinute === 0)) { // Include 18:00 as an end time
        const hour = currentHour < 10 ? `0${currentHour}` : `${currentHour}`;
        const minute = currentMinute < 10 ? `0${currentMinute}` : `${currentMinute}`;
        const startTime = `${hour}:${minute}`;

        let endHour = currentHour;
        let endMinute = currentMinute + 30;
        if (endMinute >= 60) {
          endHour += 1;
          endMinute -= 60;
        }

        if (endHour > 18 || (endHour === 18 && endMinute > 0)) break; // Do not create slots that end after 18:00

        const endHourFormatted = endHour < 10 ? `0${endHour}` : `${endHour}`;
        const endMinuteFormatted = endMinute < 10 ? `0${endMinute}` : `${endMinute}`;
        const endTime = `${endHourFormatted}:${endMinuteFormatted}`;
        
        const slotDateStart = new Date(date); // Create a new Date object from the current day
        slotDateStart.setUTCHours(currentHour, currentMinute, 0, 0); // Set UTC time components
        const fullStartTimeISO = slotDateStart.toISOString();

        const slotDateEnd = new Date(date);
        slotDateEnd.setUTCHours(endHour, endMinute, 0, 0);
        const fullEndTimeISO = slotDateEnd.toISOString();

        console.log(`Attempting to insert slot with start_time (ISO from Date): ${fullStartTimeISO}, end_time (ISO from Date): ${fullEndTimeISO}`);

        const { data: slotData, error: slotError } = await supabase
          .from('slots')
          .insert([
            {
              professional_id: professional.id,
              salon_id: salon.id,
              start_time: fullStartTimeISO, // Pass fully formed ISO string
              end_time: fullEndTimeISO,     // Pass fully formed ISO string
              status: 'available',
              price: faker.number.float({ min: 50, max: 200, precision: 2 }),
              payment_method: 'unpaid', // Default for available slots
              time: startTime,
            },
          ])
          .select();



        if (slotError) {
          console.error('Error seeding slots:', slotError);
          return;
        }
        slots.push(slotData[0]);

        currentHour = endHour;
        currentMinute = endMinute;
      }
    }
  }
  console.log(`Seeded ${slots.length} slots.`);

  // Seed Appointments (some taken slots)
  for (let i = 0; i < 10; i++) {
    const availableSlots = slots.filter((s) => s.status === 'available');
    if (availableSlots.length === 0) break;

    const slot = faker.helpers.arrayElement(availableSlots);
    const service = faker.helpers.arrayElement(services);

    const { data: appointmentData, error: appointmentError } = await supabase
      .from('appointments')
      .insert([
        {
          service_id: service.id,
          salon_id: salon.id,
          user_id: user.id, // Assign to the seeded user
          start_time: slot.start_time,
          end_time: slot.end_time,
          status: 'confirmed',
        },
      ])
      .select();

    if (appointmentError) {
      console.error('Error seeding appointments:', appointmentError);
      return;
    }
    console.log('Seeded appointment.');

    // Update the slot to be booked
    await supabase.from('slots').update({
      status: 'booked',
      client_name: faker.person.fullName(),
      client_phone: faker.phone.number(),
      service_id: service.id,
      client_id: user.id,
    }).eq('id', slot.id);
  }
  console.log('Seeded appointments.');

  // Seed Expenses
  for (let i = 0; i < 5; i++) {
    const { error: expenseError } = await supabase.from('expenses').insert([
      {
        salon_id: salon.id,
        amount: faker.number.float({ min: 100, max: 1000, precision: 2 }),
        category: faker.helpers.arrayElement(['rent', 'utilities', 'supplies', 'marketing']),
        description: faker.lorem.sentence(),
        date: faker.date.recent().toISOString().split('T')[0],
      },
    ]);
    if (expenseError) {
      console.error('Error seeding expenses:', expenseError);
      return;
    }
  }
  console.log('Seeded expenses.');

  // Seed Finance Transactions (for sales and expenses)
  for (let i = 0; i < 10; i++) {
    const transactionType = faker.helpers.arrayElement(['sale', 'expense']);
    const professional = faker.helpers.arrayElement(professionals);

    const { error: transactionError } = await supabase.from('finance_transactions').insert([
      {
        salon_id: salon.id,
        amount: faker.number.float({ min: 20, max: 500, precision: 2 }),
        transaction_type: transactionType,
        payment_method: faker.helpers.arrayElement(['credit_card', 'cash', 'debit_card']),
        professional_id: professional.id,
        description: faker.lorem.sentence(),
        client_name: transactionType === 'sale' ? faker.person.fullName() : null,
      },
    ]);
    if (transactionError) {
      console.error('Error seeding finance_transactions:', transactionError);
      return;
    }
  }
  console.log('Seeded finance_transactions.');

  // Seed Reviews
  for (let i = 0; i < 5; i++) {
    const professional = faker.helpers.arrayElement(professionals);
    const bookedSlots = slots.filter(s => s.status === 'booked' && s.professional_id === professional.id);
    if (bookedSlots.length === 0) continue;

    const slot = faker.helpers.arrayElement(bookedSlots);

    const { error: reviewError } = await supabase.from('reviews').insert([
      {
        salon_id: salon.id,
        professional_id: professional.id,
        client_id: user.id, // Assuming the seeded user makes the review
        slot_id: slot.id,
        rating: faker.number.int({ min: 3, max: 5 }),
        comment: faker.lorem.paragraph(),
        client_avatar_url: faker.image.avatar(),
      },
    ]);
    if (reviewError) {
      console.error('Error seeding reviews:', reviewError);
      return;
    }
  }
  console.log('Seeded reviews.');

  // Seed Sales (linked to slots)
  for (let i = 0; i < 5; i++) {
    const bookedSlots = slots.filter(s => s.status === 'booked');
    if (bookedSlots.length === 0) break;
    const slot = faker.helpers.arrayElement(bookedSlots);

    const { error: salesError } = await supabase.from('sales').insert([
      {
        salon_id: salon.id,
        slot_id: slot.id,
        total_amount: slot.price,
        payment_method: faker.helpers.arrayElement(['credit_card', 'cash', 'debit_card']),
        client_name: slot.client_name,
        client_phone: slot.client_phone,
      },
    ]);
    if (salesError) {
      console.error('Error seeding sales:', salesError);
      return;
    }
  }
  console.log('Seeded sales.');

  // Seed Staff Advances
  for (let i = 0; i < 3; i++) {
    const professional = faker.helpers.arrayElement(professionals);
    const { error: advanceError } = await supabase.from('staff_advances').insert([
      {
        salon_id: salon.id,
        professional_id: professional.id,
        amount: faker.number.float({ min: 50, max: 300, precision: 2 }),
        description: faker.lorem.sentence(),
        date: faker.date.recent().toISOString().split('T')[0],
      },
    ]);
    if (advanceError) {
      console.error('Error seeding staff_advances:', advanceError);
      return;
    }
  }
  console.log('Seeded staff_advances.');

  // Seed Waiting List
  for (let i = 0; i < 5; i++) {
    const professional = faker.helpers.arrayElement(professionals);
    const service = faker.helpers.arrayElement(services);
    const { error: waitingListError } = await supabase.from('waiting_list').insert([
      {
        salon_id: salon.id,
        client_name: faker.person.fullName(),
        client_phone: faker.phone.number(),
        professional_id: professional.id,
        service_preference: service.name,
        notes: faker.lorem.sentence(),
      },
    ]);
    if (waitingListError) {
      console.error('Error seeding waiting_list:', waitingListError);
      return;
    }
  }
  console.log('Seeded waiting_list.');

  console.log('Database seeding complete!');
}

seed().catch((err) => {
  console.error('Failed to seed database:', err);
});
