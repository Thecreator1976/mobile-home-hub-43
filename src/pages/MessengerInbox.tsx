import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageLoader } from "@/components/ui/loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  useConversations,
  useMessages,
  useSendMessage,
  useSendBuyerListLink,
  useConvertToBuyer,
  MessengerConversation,
} from "@/hooks/useMessenger";
import { useIntegrations } from "@/hooks/useIntegrations";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow, differenceInHours } from "date-fns";
import {
  MessageSquare,
  Send,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  UserPlus,
  Link as LinkIcon,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MessengerInbox() {
  const { data: conversations, isLoading } = useConversations();
  const { integrations } = useIntegrations();
  const [selectedConversation, setSelectedConversation] = useState<MessengerConversation | null>(null);
  const { data: messages } = useMessages(selectedConversation?.id || null);
  const sendMessage = useSendMessage();
  const sendBuyerListLink = useSendBuyerListLink();
  const convertToBuyer = useConvertToBuyer();
  
  const [replyText, setReplyText] = useState("");
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [convertName, setConvertName] = useState("");
  const [convertPhone, setConvertPhone] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get Facebook Messenger integration config
  const messengerIntegration = integrations.find(i => i.service_name === "facebook_messenger");
  const buyerListUrl = (messengerIntegration?.config as Record<string, unknown>)?.buyer_list_url as string || "";

  // Real-time subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel("messenger-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messenger_messages" },
        () => {
          // Refetch is handled by React Query invalidation
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messenger_conversations" },
        () => {
          // Refetch is handled by React Query invalidation
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check if within 24-hour messaging window
  const isWithin24Hours = (lastMessageAt: string | null): boolean => {
    if (!lastMessageAt) return false;
    return differenceInHours(new Date(), new Date(lastMessageAt)) < 24;
  };

  const handleSendReply = async () => {
    if (!selectedConversation || !replyText.trim()) return;
    
    await sendMessage.mutateAsync({
      conversationId: selectedConversation.id,
      content: replyText.trim(),
    });
    setReplyText("");
  };

  const handleSendBuyerListLink = async () => {
    if (!selectedConversation || !buyerListUrl) return;
    
    await sendBuyerListLink.mutateAsync({
      conversationId: selectedConversation.id,
      buyerListUrl,
    });
  };

  const handleConvertToBuyer = async () => {
    if (!selectedConversation || !convertName.trim()) return;
    
    await convertToBuyer.mutateAsync({
      conversationId: selectedConversation.id,
      name: convertName.trim(),
      phone: convertPhone.trim() || undefined,
    });
    setShowConvertDialog(false);
    setConvertName("");
    setConvertPhone("");
  };

  const openConvertDialog = () => {
    setConvertName(selectedConversation?.facebook_user_name || "");
    setShowConvertDialog(true);
  };

  if (isLoading) {
    return <PageLoader text="Loading conversations..." />;
  }

  const canReply = selectedConversation && isWithin24Hours(selectedConversation.last_message_at);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messenger Inbox</h1>
          <p className="text-muted-foreground">
            Manage Facebook Messenger conversations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Conversations ({conversations?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-340px)]">
                {conversations?.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-xs mt-1">Messages will appear here when prospects contact you on Facebook</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversations?.map((conv) => {
                      const within24h = isWithin24Hours(conv.last_message_at);
                      return (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv)}
                          className={cn(
                            "w-full p-3 text-left hover:bg-muted/50 transition-colors",
                            selectedConversation?.id === conv.id && "bg-muted"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={conv.profile_pic_url || undefined} />
                              <AvatarFallback>
                                {conv.facebook_user_name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium truncate">
                                  {conv.facebook_user_name || "Facebook User"}
                                </span>
                                {within24h ? (
                                  <Badge variant="outline" className="bg-green-500/10 text-green-600 text-xs shrink-0">
                                    <Clock className="h-3 w-3 mr-1" />
                                    24h
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground text-xs shrink-0">
                                    Expired
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {conv.status === "converted" && (
                                  <Badge variant="secondary" className="text-xs">
                                    <UserPlus className="h-3 w-3 mr-1" />
                                    Buyer
                                  </Badge>
                                )}
                                {conv.last_message_at && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Message Thread */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header */}
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={selectedConversation.profile_pic_url || undefined} />
                        <AvatarFallback>
                          {selectedConversation.facebook_user_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">
                          {selectedConversation.facebook_user_name || "Facebook User"}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-0.5">
                          {canReply ? (
                            <Badge className="bg-green-500/10 text-green-600 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Can Reply (24h window)
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              <XCircle className="h-3 w-3 mr-1" />
                              24h Window Expired
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {selectedConversation.status !== "converted" && (
                        <Button variant="outline" size="sm" onClick={openConvertDialog}>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Convert to Buyer
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-4 overflow-hidden">
                  <ScrollArea className="h-[calc(100vh-500px)]">
                    <div className="space-y-4">
                      {messages?.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            msg.direction === "outbound" ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg px-4 py-2",
                              msg.direction === "outbound"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p
                              className={cn(
                                "text-xs mt-1",
                                msg.direction === "outbound"
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              )}
                            >
                              {format(new Date(msg.created_at), "MMM d, h:mm a")}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* Reply Input */}
                <div className="p-4 border-t space-y-3">
                  {!canReply && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>24-hour messaging window has expired. User must message you first to re-open the window.</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder={canReply ? "Type a message..." : "Cannot reply - window expired"}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendReply()}
                      disabled={!canReply || sendMessage.isPending}
                    />
                    <Button
                      onClick={handleSendReply}
                      disabled={!canReply || !replyText.trim() || sendMessage.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleSendBuyerListLink}
                      disabled={!canReply || !buyerListUrl || sendBuyerListLink.isPending}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Send Buyer List Link
                    </Button>
                    {!buyerListUrl && (
                      <p className="text-xs text-muted-foreground self-center">
                        Configure Buyer List URL in Integrations
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Convert to Buyer Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Buyer</DialogTitle>
            <DialogDescription>
              Create a buyer record from this conversation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="convert-name">Name</Label>
              <Input
                id="convert-name"
                value={convertName}
                onChange={(e) => setConvertName(e.target.value)}
                placeholder="Enter buyer name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="convert-phone">Phone (optional)</Label>
              <Input
                id="convert-phone"
                value={convertPhone}
                onChange={(e) => setConvertPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConvertToBuyer} disabled={!convertName.trim() || convertToBuyer.isPending}>
              Convert to Buyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
