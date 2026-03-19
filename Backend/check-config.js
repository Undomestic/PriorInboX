const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('\n=== PriorInboX OAuth Configuration Check ===\n');

// Check Database
console.log('📊 DATABASE:');
console.log(`  Host: ${process.env.DB_HOST || '❌ NOT SET'}`);
console.log(`  User: ${process.env.DB_USER || '❌ NOT SET'}`);
console.log(`  Password: ${process.env.DB_PASSWORD ? '✅ SET' : '❌ NOT SET'}`);
console.log(`  Database: ${process.env.DB_NAME || '❌ NOT SET'}`);

// Check JWT
console.log('\n🔐 JWT:');
console.log(`  Secret: ${process.env.JWT_SECRET && !process.env.JWT_SECRET.includes('change_in_production') ? '✅ SET' : '⚠️  DEFAULT/NOT SET'}`);

// Check Encryption Key
console.log('\n🔑 ENCRYPTION:');
const encKey = process.env.ENCRYPTION_KEY || '32bytesecureencryptionkeyhere123';
const isValidEncKey = encKey.length >= 32;
console.log(`  Key Length: ${encKey.length} bytes (${isValidEncKey ? '✅ VALID (>=32)' : '❌ TOO SHORT'})`);

// Check OAuth Providers
console.log('\n🔐 OAUTH PROVIDERS:\n');

const providers = [
  {
    name: 'Gmail',
    id: 'GMAIL',
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    redirectUri: process.env.GMAIL_REDIRECT_URI
  },
  {
    name: 'Outlook',
    id: 'OUTLOOK',
    clientId: process.env.OUTLOOK_CLIENT_ID,
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
    redirectUri: process.env.OUTLOOK_REDIRECT_URI
  },
  {
    name: 'Yahoo',
    id: 'YAHOO',
    clientId: process.env.YAHOO_CLIENT_ID,
    clientSecret: process.env.YAHOO_CLIENT_SECRET,
    redirectUri: process.env.YAHOO_REDIRECT_URI
  }
];

providers.forEach(provider => {
  const hasClientId = provider.clientId && !provider.clientId.includes('YOUR_');
  const hasSecret = provider.clientSecret && !provider.clientSecret.includes('YOUR_');
  
  console.log(`${provider.name}:`);
  console.log(`  Client ID: ${hasClientId ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}`);
  console.log(`  Secret: ${hasSecret ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}`);
  console.log(`  Redirect URI: ${provider.redirectUri || '❌ NOT SET'}`);
  console.log();
});

// Summary
console.log('=== SUMMARY ===\n');

const hasAllRequired = 
  process.env.DB_HOST &&
  process.env.DB_USER &&
  process.env.DB_PASSWORD &&
  process.env.DB_NAME;

const hasAllOAuth = providers.every(p => 
  p.clientId && !p.clientId.includes('YOUR_') &&
  p.clientSecret && !p.clientSecret.includes('YOUR_')
);

if (hasAllRequired && hasAllOAuth && isValidEncKey) {
  console.log('✅ All configurations are properly set!');
  console.log('   Ready to start the server.\n');
} else {
  console.log('⚠️  Some configurations are missing:\n');
  if (!hasAllRequired) {
    console.log('  • Database credentials not fully configured');
  }
  if (!hasAllOAuth) {
    console.log('  • OAuth credentials need to be configured');
    console.log('    1. Go to Google Cloud Console and create OAuth 2.0 credentials for Gmail');
    console.log('    2. Go to Azure Portal and create OAuth app for Outlook');
    console.log('    3. Go to Yahoo Developer Console for Yahoo OAuth');
    console.log('    4. Add credentials to .env file');
  }
  if (!isValidEncKey) {
    console.log('  • ENCRYPTION_KEY is too short (needs at least 32 bytes)');
    console.log('    Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
}
