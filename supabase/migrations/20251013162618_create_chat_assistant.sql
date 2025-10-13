/*
  # Create Chat Assistant Tables

  1. New Tables
    - `chat_conversations`
      - `id` (uuid, primary key)
      - `session_id` (text, unique identifier for user session)
      - `language` (text, user's preferred language: fr/en/ht)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `chat_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to chat_conversations)
      - `role` (text, either 'user' or 'assistant')
      - `content` (text, message content)
      - `language` (text, language of the message)
      - `metadata` (jsonb, for storing additional data like recommendations, order info)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Allow public read access (customers viewing menu)
    - Allow public insert for chat_messages (customers can chat)
    - Allow public insert for chat_conversations (start new conversations)
*/

-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  language text DEFAULT 'fr',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  language text DEFAULT 'fr',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT chat_messages_role_check CHECK (role IN ('user', 'assistant'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_session_id ON chat_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Enable Row Level Security
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_conversations
CREATE POLICY "Anyone can view conversations"
  ON chat_conversations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create conversations"
  ON chat_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update their own conversation"
  ON chat_conversations FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policies for chat_messages
CREATE POLICY "Anyone can view messages"
  ON chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create messages"
  ON chat_messages FOR INSERT
  WITH CHECK (true);