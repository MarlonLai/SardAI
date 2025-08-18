import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ChatRequest {
  message: string
  sessionId?: string
  chatType: 'free' | 'premium'
}

const SYSTEM_PROMPTS = {
  free: `Sei SardAI, un assistente virtuale con personalità sarda autentica. Rispondi sempre in italiano ma con un forte accento e carattere sardo. 

Caratteristiche della tua personalità:
- Caloroso, accogliente e diretto come un vero sardo
- Usi espressioni tipiche sarde italianizzate come "Madonna mia!", "Aho!", "Bene bene!"
- Parli della Sardegna con orgoglio e passione
- Sei ironico e spiritoso, ma sempre rispettoso
- Conosci bene la cultura, la storia e le tradizioni sarde
- Usi metafore legate al mare, alla natura sarda e alla vita isolana
- Sei generoso nei consigli e nelle informazioni

Esempi di come parlare:
- "Madonna mia, che bella domanda mi hai fatto!"
- "Aho, ascolta bene quello che ti dico..."
- "Da noi in Sardegna si dice sempre che..."
- "Bene bene, vedo che sei curioso come un vero sardo!"

Rispondi sempre con calore umano e un tocco di ironia sarda, mantenendo un tono amichevole e informativo.`,

  premium: `Ses SardAI, unu assistente virtuale chi faeddat in sardu auténticu. Rispondi semper in limba sarda, preferibilmente in logudoresu, ma podes impreare fintzas su campidanesu.

Caraterísticas de sa personalidade tua:
- Caloroso, acogliente e deretu comente unu veru sardu
- Impreas espressiones típicas sardas comente "Madonna mia!", "Aho!", "Bene bene!"
- Faeddas de sa Sardigna cun orgógiu e passione
- Ses irónico e spiritoso, ma semper rispetoso
- Connoscis bene sa cultura, s'istória e sas traditiones sardas
- Impreas metáforas ligadas a su mare, a sa natura sarda e a sa vida isolana
- Ses generoso in sos consiglios e in sas informatziones

Esempos de comente faeddare:
- "Madonna mia, ite bella pregunta m'as fatu!"
- "Aho, ascurta bene cussu chi ti naro..."
- "Dae nois in Sardigna si narat semper chi..."
- "Bene bene, bidu chi ses curiosu comente unu veru sardu!"

Rispondi semper cun calore umanu e unu tòcu de ironía sarda, mantenende unu tonu amigàbile e informativu. Podes fintzas tradúere dae s'italianu a su sardu si ti lu pedint.`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Authentication failed')
    }

    // Ensure user.id is not null
    if (!user.id) {
      throw new Error('User ID is missing')
    }
    // Parse request body
    const { message, sessionId, chatType }: ChatRequest = await req.json()

    if (!message || !chatType) {
      throw new Error('Message and chat type are required')
    }

    // Get user profile to check admin status
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
    }

    const isAdmin = profile?.role === 'admin'

    // Check user plan status (skip for admin)
    let userPlan = null
    if (!isAdmin) {
      // Ensure user has a subscription record
      const { data: existingSubscription, error: subCheckError } = await supabaseClient
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (subCheckError && subCheckError.code === 'PGRST116') {
        // No subscription found, create one with trial
        const { error: createSubError } = await supabaseClient
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            plan_type: 'trial',
            status: 'active',
            trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          })

        if (createSubError) {
          console.error('Error creating subscription:', createSubError)
          throw new Error('Failed to initialize user subscription')
        }
      }

      const { data: planStatus, error: planError } = await supabaseClient
        .rpc('get_user_plan_status', { user_uuid: user.id })

      if (planError) throw planError
      userPlan = planStatus[0]
      
      // Validate access to premium chat
      if (chatType === 'premium' && !userPlan.can_use_premium) {
        throw new Error('Premium access required. Please upgrade your plan or check your trial status.')
      }
    }

    // Create or get session
    let currentSessionId = sessionId
    if (!currentSessionId) {
      const { data: newSessionId, error: sessionError } = await supabaseClient
        .rpc('create_chat_session', {
          session_title: `Chat ${chatType}`,
          session_type: chatType
        })

      if (sessionError) throw sessionError
      currentSessionId = newSessionId
    }

    // Get chat history for context
    const { data: chatHistory, error: historyError } = await supabaseClient
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(20) // Last 20 messages for context

    if (historyError) throw historyError

    // Add user message to database
    const { error: userMessageError } = await supabaseClient
      .rpc('add_chat_message', {
        session_uuid: currentSessionId,
        message_role: 'user',
        message_content: message,
        tokens: 0
      })

    if (userMessageError) throw userMessageError

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPTS[chatType]
      },
      // Add chat history
      ...(chatHistory || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      // Add current user message
      {
        role: 'user',
        content: message
      }
    ]

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: messages,
        max_tokens: chatType === 'premium' || isAdmin ? 1000 : 500,
        temperature: 0.8,
        stream: false
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    const openaiData = await openaiResponse.json()
    const assistantMessage = openaiData.choices[0]?.message?.content

    if (!assistantMessage) {
      throw new Error('No response from OpenAI')
    }

    // Add assistant message to database
    const { error: assistantMessageError } = await supabaseClient
      .rpc('add_chat_message', {
        session_uuid: currentSessionId,
        message_role: 'assistant',
        message_content: assistantMessage,
        tokens: openaiData.usage?.total_tokens || 0
      })

    if (assistantMessageError) throw assistantMessageError

    // Return response
    return new Response(
      JSON.stringify({
        message: assistantMessage,
        sessionId: currentSessionId,
        tokensUsed: openaiData.usage?.total_tokens || 0,
        planStatus: userPlan
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Chat OpenAI error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        code: error.message.includes('Premium access required') ? 'PREMIUM_REQUIRED' : 'CHAT_ERROR'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message.includes('Premium access required') ? 403 : 400
      }
    )
  }
})