require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  try {
    console.log('Connecting to Supabase...');
    
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('Connected to Supabase');
    
    // Check clients table
    console.log('Checking clients table...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
      
    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
    } else {
      console.log(`Found ${clients.length} clients`);
      if (clients.length > 0) {
        console.log('Client sample:', {
          id: clients[0].id,
          client_name: clients[0].client_name,
          login_key: clients[0].login_key ? '***' : 'null',
          hasOrganization: 'organization' in clients[0],
          hasQuestions: 'questions' in clients[0]
        });
      }
    }
    
    // Check submissions table structure
    console.log('Checking submissions table...');
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('*')
      .limit(1);
      
    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      
      // Check if table exists
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_tables');
        
      if (tablesError) {
        console.error('Error listing tables:', tablesError);
      } else {
        console.log('Available tables:', tables);
      }
    } else {
      console.log(`Found ${submissions.length} submissions`);
      if (submissions.length > 0) {
        console.log('Submission sample:', {
          id: submissions[0].id,
          client_id: submissions[0].client_id,
          client_name: submissions[0].client_name,
          login_key: submissions[0].login_key ? '***' : 'null',
          responses: typeof submissions[0].responses === 'object' ? 'Object' : 
                   typeof submissions[0].responses === 'string' ? 'String' : 'Unknown'
        });
      }
    }
    
    // Create a test submission
    console.log('Attempting to create a test submission...');
    const testSubmission = {
      client_id: 'test-client-id',
      client_name: 'Test Client',
      login_key: 'test-login-key',
      responses: { 
        '0': {
          questionText: 'Test Question',
          responseType: 'text',
          textResponse: 'Test Response',
          timestamp: new Date().toISOString()
        }
      }
    };
    
    const { data: insertedSubmission, error: insertError } = await supabase
      .from('submissions')
      .insert([testSubmission])
      .select();
      
    if (insertError) {
      console.error('Error creating test submission:', insertError);
    } else {
      console.log('Test submission created successfully:', insertedSubmission);
      
      // Clean up test submission
      const { error: deleteError } = await supabase
        .from('submissions')
        .delete()
        .eq('client_id', 'test-client-id');
        
      if (deleteError) {
        console.error('Error deleting test submission:', deleteError);
      } else {
        console.log('Test submission deleted successfully');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main(); 