import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  jarId: string;
  jarName: string;
}

const InviteModal = ({ isOpen, onClose, jarId, jarName }: InviteModalProps) => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const sendInvite = async () => {
    if (!email.trim()) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('jar_invitations')
        .insert({
          jar_id: jarId,
          inviter_id: user.id,
          invitee_email: email,
        });

      if (error) throw error;

      toast({
        title: "Invitation sent!",
        description: `Invited ${email} to contribute to ${jarName}`,
      });

      setEmail('');
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Someone to Contribute</DialogTitle>
          <DialogDescription>
            Share "{jarName}" with someone so they can contribute to this savings goal
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button onClick={sendInvite} disabled={sending} className="w-full">
            <Mail className="mr-2 h-4 w-4" />
            {sending ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteModal;