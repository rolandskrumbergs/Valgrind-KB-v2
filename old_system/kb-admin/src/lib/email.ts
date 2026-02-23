import sgMail, { MailDataRequired } from "@sendgrid/mail";
import { db } from "../db";
import { user } from "../db/schema";
import { eq } from "drizzle-orm";

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface DynamicTemplateData {
  invite_url?: string;
  reset_url?: string;
  token?: string;
  [key: string]: string | number | boolean | undefined;
}

interface DynamicTemplateEmailOptions {
  to: string;
  from?: string;
  templateId: string;
  dynamicTemplateData: DynamicTemplateData;
}

/**
 * Sends an email using SendGrid dynamic templates
 * @param options The options for sending the email including template ID and dynamic data
 * @returns A promise that resolves to the success status and any error if applicable
 */
export async function sendDynamicTemplateEmail({
  to,
  from = process.env.SENDGRID_FROM_EMAIL!,
  templateId,
  dynamicTemplateData,
}: DynamicTemplateEmailOptions) {
  try {
    const msg: MailDataRequired = {
      to,
      from,
      templateId,
      dynamicTemplateData,
    };

    console.log("Sending email with message:", msg);

    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error("Error sending dynamic template email:", error);
    return { success: false, error };
  }
}

interface SendPasswordResetEmailOptions {
  email: string;
  resetUrl: string;
}

/**
 * Sends a password reset email to the user based on their email type (invitation or regular)
 * @param options Object containing email, resetUrl and token
 * @returns A promise that resolves to the success status and any error if applicable
 */
export async function sendPasswordResetEmail({
  email,
  resetUrl,
}: SendPasswordResetEmailOptions) {
  try {
    // Fetch user from database
    const userData = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (!userData) {
      throw new Error("User not found");
    }

    // Check if user requires invitation password reset
    if (userData.invited) {
      console.log(
        "Sending invitation password reset email to:",
        userData.email,
      );

      return await sendDynamicTemplateEmail({
        to: email,
        templateId: process.env.SENDGRID_PASSWORD_RESET_FOR_INVITE_TEMPLATE_ID!,
        dynamicTemplateData: {
          reset_url: resetUrl,
        },
      });
    } else {
      console.log("Sending regular password reset email to:", userData.email);

      return await sendDynamicTemplateEmail({
        to: email,
        templateId: process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID!,
        dynamicTemplateData: {
          reset_url: resetUrl,
          user_name: userData.name + " " + userData.lastName,
        },
      });
    }
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return { success: false, error };
  }
}
