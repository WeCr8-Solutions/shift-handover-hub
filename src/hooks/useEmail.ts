import { supabase } from '@/integrations/supabase/client';

type EmailType = 
  | 'welcome' 
  | 'password-reset' 
  | 'team-invite' 
  | 'promo-code' 
  | 'handoff-notification';

interface SendEmailParams {
  type: EmailType;
  to: string;
  data: Record<string, unknown>;
}

export function useEmail() {
  const sendEmail = async ({ type, to, data }: SendEmailParams) => {
    try {
      const { data: response, error } = await supabase.functions.invoke('send-email', {
        body: { type, to, data },
      });

      if (error) {
        console.error('Error sending email:', error);
        throw error;
      }

      return { success: true, data: response };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, error };
    }
  };

  // Convenience methods for each email type
  const sendWelcomeEmail = async (to: string, userName: string) => {
    return sendEmail({
      type: 'welcome',
      to,
      data: { userName },
    });
  };

  const sendPasswordResetEmail = async (to: string, userName: string, resetUrl: string) => {
    return sendEmail({
      type: 'password-reset',
      to,
      data: { userName, resetUrl, expiryMinutes: 60 },
    });
  };

  const sendTeamInviteEmail = async (
    to: string,
    inviterName: string,
    teamName: string,
    inviteUrl: string,
    role: string = 'member'
  ) => {
    return sendEmail({
      type: 'team-invite',
      to,
      data: { inviterName, teamName, inviteUrl, role },
    });
  };

  const sendPromoCodeEmail = async (
    to: string,
    recipientName: string,
    senderName: string,
    promoCode: string,
    discountAmount: string,
    expiryDate: string
  ) => {
    return sendEmail({
      type: 'promo-code',
      to,
      data: { recipientName, senderName, promoCode, discountAmount, expiryDate },
    });
  };

  const sendHandoffNotificationEmail = async (
    to: string,
    data: {
      recipientName: string;
      stationName: string;
      outgoingOperator: string;
      shift: string;
      workOrder: string;
      partNumber: string;
      status: string;
      summary: string;
    }
  ) => {
    return sendEmail({
      type: 'handoff-notification',
      to,
      data,
    });
  };

  return {
    sendEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendTeamInviteEmail,
    sendPromoCodeEmail,
    sendHandoffNotificationEmail,
  };
}
