-- Create messenger_conversations table
CREATE TABLE public.messenger_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facebook_user_id TEXT NOT NULL,
  facebook_user_name TEXT,
  profile_pic_url TEXT,
  buyer_id UUID REFERENCES public.buyers(id) ON DELETE SET NULL,
  seller_lead_id UUID REFERENCES public.seller_leads(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active',
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Create messenger_messages table
CREATE TABLE public.messenger_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.messenger_conversations(id) ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  facebook_message_id TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messenger_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messenger_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for messenger_conversations
CREATE POLICY "Agents and admins can manage conversations"
ON public.messenger_conversations
FOR ALL
USING (is_admin_or_agent(auth.uid()));

CREATE POLICY "Agents and admins can view conversations"
ON public.messenger_conversations
FOR SELECT
USING (is_admin_or_agent(auth.uid()));

-- RLS policies for messenger_messages
CREATE POLICY "Agents and admins can manage messages"
ON public.messenger_messages
FOR ALL
USING (is_admin_or_agent(auth.uid()));

CREATE POLICY "Agents and admins can view messages"
ON public.messenger_messages
FOR SELECT
USING (is_admin_or_agent(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_messenger_conversations_facebook_user_id ON public.messenger_conversations(facebook_user_id);
CREATE INDEX idx_messenger_conversations_status ON public.messenger_conversations(status);
CREATE INDEX idx_messenger_messages_conversation_id ON public.messenger_messages(conversation_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messenger_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messenger_messages;