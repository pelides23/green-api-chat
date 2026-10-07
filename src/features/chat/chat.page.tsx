import { useCallback, useState } from "react";
import { type Message } from "./domain/message";
import { useIncomingMessages } from "./model/use-incoming-messages";
import { useSendMessage } from "./model/use-send-message";
import { ChatList } from "./ui/chat-list";
import { CreateChatForm } from "./ui/create-chat-form";
import { MessageList } from "./ui/message-list";
import { SendMessageForm } from "./ui/send-message-form";

export const ChatPage = () => {
  const [chats, setChats] = useState<Pick<Message, "phone">[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sendMessageMutation = useSendMessage();

  const selectedMessages = messages.filter(
    (message) => message.phone === selectedPhone,
  );

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      const exists = prev.some((item) => item.id === message.id);

      return exists ? prev : [...prev, message];
    });

    setChats((prev) => {
      const exists = prev.some((item) => item.phone === message.phone);

      return exists ? prev : [...prev, { phone: message.phone }];
    });
  }, []);

  const onSendMessage = async (phone: string, text: string) => {
    const message = await sendMessageMutation.sendMessage({ phone, text });
    setMessages((prev) => [...prev, message]);
  };

  const onCreateChat = (phone: string) => {
    setSelectedPhone(phone);
    setChats((prev) => {
      const exists = prev.some((chat) => chat.phone === phone);

      return exists ? prev : [{ phone }, ...prev];
    });
  };

  useIncomingMessages({
    onMessage: addMessage,
  });

  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden">
      <div className="min-h-0 flex-1 grid border border-border bg-background grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="flex min-h-0 min-w-0 flex-col border-r border-b-0">
          <div className="shrink-0 border-b border-border p-6">
            <h1 className="mb-6 text-lg font-medium">Чаты</h1>

            <CreateChatForm
              onCreateChat={onCreateChat}
              disabled={isSubmitting}
            />
          </div>

          <ChatList
            chats={chats}
            selectedPhone={selectedPhone}
            onSelectChat={setSelectedPhone}
          />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-col">
          <header className="shrink-0 border-b border-border p-6">
            {selectedPhone ? (
              <h2 className="text-lg font-medium">+{selectedPhone}</h2>
            ) : (
              <h2 className="text-lg font-medium">Чат не выбран</h2>
            )}
          </header>

          <MessageList
            selectedPhone={selectedPhone}
            messages={selectedMessages}
          />

          <SendMessageForm
            selectedPhone={selectedPhone}
            isPending={sendMessageMutation.isPending}
            onSendMessage={onSendMessage}
            onSubmittingChange={setIsSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export const Component = ChatPage;
