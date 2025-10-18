import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Check, X } from 'lucide-react';

interface Invitation {
  id: string;
  jar_id: string;
  invitee_email: string;
  status: string;
  shared_jars: {
    jar_name: string;
    owner_id: string;
  };
  profiles: {
    email: string;
  };
}

const InvitationsPanel = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('jar_invitations')
        .select(`
          *,
          shared_jars (jar_name, owner_id)
        `)
        .or(`invitee_email.eq.${user.email},invitee_id.eq.${user.id}`)
        .eq('status', 'pending');

      if (error) throw error;

      // Get inviter emails separately
      const dataWithInviters = await Promise.all((data || []).map(async (inv) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', inv.inviter_id)
          .single();
        
        return {
          ...inv,
          profiles: profile || { email: 'Unknown' }
        };
      }));

      setInvitations(dataWithInviters);
    } catch (error: any) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitation = async (invitationId: string, status: 'accepted' | 'declined') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('jar_invitations')
        .update({ status, invitee_id: user.id })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: status === 'accepted' ? "Invitation accepted!" : "Invitation declined",
        description: status === 'accepted' ? "You can now contribute to this jar" : "",
      });

      loadInvitations();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (loading) return null;
  if (invitations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
        <CardDescription>You've been invited to contribute to these jars</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">{invitation.shared_jars?.jar_name}</p>
              <p className="text-sm text-muted-foreground">
                From: {invitation.profiles?.email}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleInvitation(invitation.id, 'accepted')}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleInvitation(invitation.id, 'declined')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default InvitationsPanel;