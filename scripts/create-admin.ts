import { config } from 'dotenv';

config();

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Admin';
  // Default to localhost:3100, can be overridden by 5th arg
  const baseUrl = process.argv[5] || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';
  // Allow overriding URL via another arg or env var if needed, but simple is best for now.
  // Actually, better-auth runs on the Next.js app, so we need to hit the app URL.

  if (!email || !password) {
    console.error('Usage: npx tsx scripts/create-admin.ts <email> <password> [name] [url]');
    console.error(
      'Example: npx tsx scripts/create-admin.ts admin@example.com mypassword123 "Admin" http://localhost:8787',
    );
    process.exit(1);
  }

  console.log(`Creating user "${name}" (${email}) at ${baseUrl}/api/setup-admin...`);

  try {
    const response = await fetch(`${baseUrl}/api/setup-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response Status:', response.status);
      console.error('Response Headers:', JSON.stringify([...response.headers.entries()]));
      console.error('Response Body:', errorText);
      throw new Error(`Failed to create user: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    console.log('✅ User created successfully!');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error creating user:', error);
    console.log('\nMake sure your development server is running (pnpm dev).');
  }
}

createAdmin();
