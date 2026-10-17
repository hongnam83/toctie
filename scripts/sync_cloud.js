const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    envVars[key] = val;
  }
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function sync() {
  const storePath = path.join(__dirname, '..', 'data', 'store.json');
  const storeContent = fs.readFileSync(storePath, 'utf8');
  const parsed = JSON.parse(storeContent);

  console.log(`Syncing store.json (${parsed.users.length} users, ${parsed.codes.length} codes) to Supabase Storage...`);

  const { error } = await supabase.storage
    .from('toctie-store')
    .upload('store.json', storeContent, {
      upsert: true,
      contentType: 'application/json',
    });

  if (error) {
    console.error('Upload error:', error);
    process.exit(1);
  }

  console.log('Successfully pushed to Supabase Cloud Storage toctie-store/store.json!');

  // Verify
  const { data, error: dlErr } = await supabase.storage.from('toctie-store').download('store.json');
  if (dlErr) {
    console.error('Download verification error:', dlErr);
    process.exit(1);
  }

  const dlText = await data.text();
  const dlJson = JSON.parse(dlText);
  console.log(`Verification: Cloud store currently contains ${dlJson.users.length} users and ${dlJson.codes.length} codes.`);
  console.log('Custom codes in cloud:', dlJson.codes.filter(c => !c.code.startsWith('TOCTIE-2010')).map(c => c.code));
}

sync().catch(console.error);
