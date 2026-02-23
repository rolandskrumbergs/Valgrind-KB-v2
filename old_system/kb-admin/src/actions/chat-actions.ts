"use server";

import { myProvider } from "@/ai/providers";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getKnowledgeBaseInvocations,
  getMessageById,
} from "@/db/queries/chat-queries";
import type { Message } from "ai";
import { generateText } from "ai";
import { CheckPermissionOfUser, GetSessionInServer } from "./auth-action";
import {
  type LenaProfile,
  updateLenaProfile,
  deleteLenaProfile,
  readLenaProfileById,
  readAllLenaProfiles,
  readActiveLenaProfile,
  insertLenaProfile,
  setAllProfilesInactive,
  setDefaultProfileActive,
  updateProfileActiveStatus,
  readAllTokenUsage,
} from "@/db/queries/lena-queries";
import { tryCatch } from "@/lib/try-catch";
import type { User } from "@/db/schema";
export async function generateTitleFromUserMessage({
  message,
}: {
  message: Message;
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel("gpt-4-turbo"),
    system: `\n
	  - you will generate a short title based on the first message a user begins a conversation with
	  - ensure it is not more than 80 characters long
	  - the title should be a summary of the user's message
	  - the title should be in Swedish
	  - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function getKnowledgeBaseInvocationsAction() {
  const sessionData = await GetSessionInServer();
  if (!sessionData) {
    return { error: "Unauthorized. Please login." };
  }

  const hasAccess = await tryCatch(
    CheckPermissionOfUser(sessionData.user.id, "lenaAnalytics", "read"),
  );

  if (hasAccess.error) {
    return {
      error: `Error checking permission: ${hasAccess.error}`,
    };
  }

  if (!hasAccess.data.success) {
    return {
      error: "You do not have permission to view knowledge base invocations",
    };
  }

  const result = await tryCatch(getKnowledgeBaseInvocations());

  if (result.error) {
    return {
      error: `Failed to get knowledge base invocations: ${result.error}`,
    };
  }

  return result.data;
}

const checkIfProfileIsActive = async (profile: LenaProfile) => {
  // Check if a profile with the same name already exists (excluding the current profile)
  const existingProfiles = await tryCatch(readAllLenaProfiles());

  if (existingProfiles.error) {
    return {
      error: `Error checking existing profiles: ${existingProfiles.error}`,
    };
  }

  const profileWithSameName = existingProfiles.data.find(
    (p) =>
      p.profileName?.toLowerCase() === profile.profileName?.toLowerCase() &&
      p.id !== profile.id,
  );

  if (profileWithSameName) {
    return {
      error: `A profile with the name "${profile.profileName}" already exists. Please choose a different name.`,
    };
  }

  return {
    error: null,
  };
};

export async function updateLenaProfileAction(profile: LenaProfile) {
  if (!profile.id) {
    return { error: "Profile ID is required" };
  }

  if (!profile.profileName) {
    return { error: "Profile name is required" };
  }

  if (profile.profileName === "default") {
    return { error: "Updating the DEFAULT PROFILE is restricted" };
  }

  const sessionData = await GetSessionInServer();
  if (!sessionData) {
    return { error: "Unauthorized. Please login." };
  }

  const hasAccess = await tryCatch(
    CheckPermissionOfUser(sessionData.user.id, "lenaProfile", "update"),
  );

  if (hasAccess.error) {
    return {
      error: `Error checking permission: ${hasAccess.error}`,
    };
  }

  if (!hasAccess.data.success) {
    return { error: "You do not have permission to update Lena profile" };
  }

  const profileCheck = await checkIfProfileIsActive(profile);
  if (profileCheck.error) {
    return { error: profileCheck.error };
  }

  // Server-side validation
  const validatedProfile = {
    ...profile,
    threshold: Math.min(Math.max(profile.threshold || 4, 4), 8),
    highConfidenceThreshold: Math.min(
      Math.max(
        profile.highConfidenceThreshold || 5,
        (profile.threshold || 4) + 1,
      ),
      9,
    ),
    thresholdRequiredChunks: Math.min(
      profile.thresholdRequiredChunks || 1,
      (profile.topK || 4) * 4,
    ),
    requiredHighConfidenceChunks: Math.min(
      profile.requiredHighConfidenceChunks || 1,
      (profile.topK || 4) * 4,
    ),
  };

  const result = await tryCatch(
    updateLenaProfile(
      validatedProfile,
      sessionData.user.id,
      sessionData.user.name,
    ),
  );

  if (result.error) {
    return { error: `Failed to update lena profile: ${result.error}` };
  }

  return result.data;
}

export async function createLenaProfileAction(profile: LenaProfile) {
  if (!profile.profileName) {
    return { error: "Profile name is required" };
  }

  if (profile.profileName === "default") {
    return { error: "You cannot create a profile with the name 'default'" };
  }

  const sessionData = await GetSessionInServer();
  if (!sessionData) {
    return { error: "Unauthorized. Please login." };
  }

  const hasAccess = await tryCatch(
    CheckPermissionOfUser(sessionData.user.id, "lenaProfile", "create"),
  );

  if (hasAccess.error) {
    return {
      error: `Error checking permission: ${hasAccess.error}`,
    };
  }

  if (!hasAccess.data.success) {
    return { error: "You do not have permission to create Lena profile" };
  }

  const profileCheck = await checkIfProfileIsActive(profile);
  if (profileCheck.error) {
    return { error: profileCheck.error };
  }

  // Server-side validation
  const validatedProfile = {
    ...profile,
    threshold: Math.min(Math.max(profile.threshold || 4, 4), 8),
    highConfidenceThreshold: Math.min(
      Math.max(
        profile.highConfidenceThreshold || 5,
        (profile.threshold || 4) + 1,
      ),
      9,
    ),
    thresholdRequiredChunks: Math.min(
      profile.thresholdRequiredChunks || 1,
      (profile.topK || 4) * 4,
    ),
    requiredHighConfidenceChunks: Math.min(
      profile.requiredHighConfidenceChunks || 1,
      (profile.topK || 4) * 4,
    ),
  };

  const result = await tryCatch(
    insertLenaProfile(
      validatedProfile,
      sessionData.user.id,
      sessionData.user.name,
    ),
  );

  if (result.error) {
    return { error: `Failed to create lena profile: ${result.error}` };
  }

  return result.data;
}

export async function getLenaProfileByIdAction(
  selectedProfileID: string | undefined,
) {
  if (!selectedProfileID) {
    return { error: "No profile ID provided" };
  }

  const result = await tryCatch(readLenaProfileById(selectedProfileID));

  if (result.error) {
    return { error: `Failed to get lena profile by id: ${result.error}` };
  }

  if (!result.data) {
    return { error: "No Lena profile found with the specified ID" };
  }

  return result.data;
}

export async function getAllLenaProfilesAction() {
  const sessionData = await GetSessionInServer();
  if (!sessionData) {
    return { error: "Unauthorized. Please login." };
  }

  const hasAccess = await tryCatch(
    CheckPermissionOfUser(sessionData.user.id, "lenaProfile", "read"),
  );

  if (hasAccess.error) {
    return {
      error: `Error checking permission: ${hasAccess.error}`,
    };
  }

  if (!hasAccess.data.success) {
    return { error: "You do not have permission to view Lena profiles" };
  }

  const result = await tryCatch(readAllLenaProfiles());

  if (result.error) {
    return { error: `Failed to fetch lena profiles: ${result.error}` };
  }

  return result.data;
}

export async function toggleLenaProfileActiveStatusAction(
  id: string,
  active: boolean,
) {
  const sessionData = await GetSessionInServer();
  if (!sessionData) {
    return { error: "Unauthorized. Please login." };
  }

  const hasAccess = await tryCatch(
    CheckPermissionOfUser(sessionData.user.id, "lenaProfile", "update"),
  );

  if (hasAccess.error) {
    return {
      error: `Error checking permission: ${hasAccess.error}`,
    };
  }

  if (!hasAccess.data.success) {
    return { error: "You do not have permission to update Lena profile" };
  }

  // First, if setting to active=true, set all other profiles to inactive
  if (active) {
    const setInactiveResult = await tryCatch(
      setAllProfilesInactive(sessionData.user.id, sessionData.user.name),
    );

    if (setInactiveResult.error) {
      return { error: `Failed to update profiles: ${setInactiveResult.error}` };
    }
  } else {
    // If setting a profile to inactive, set the default profile to active
    const setDefaultResult = await tryCatch(
      setDefaultProfileActive(sessionData.user.id, sessionData.user.name),
    );

    if (setDefaultResult.error) {
      return {
        error: `Failed to set default profile active: ${setDefaultResult.error}`,
      };
    }
  }

  // Then update the specific profile
  const updateResult = await tryCatch(
    updateProfileActiveStatus(
      id,
      active,
      sessionData.user.id,
      sessionData.user.name,
    ),
  );

  if (updateResult.error) {
    return { error: `Failed to update profile status: ${updateResult.error}` };
  }

  return { success: true };
}

export async function getLenaProfileForChatAction(
  profileId: string | undefined,
  user: User,
) {
  if (user.role === "user") {
    const result = await tryCatch(readActiveLenaProfile());
    if (result.error) {
      return { error: result.error, data: null };
    }

    return { error: null, data: result.data };
  }

  if (!profileId) {
    const result = await tryCatch(readActiveLenaProfile());
    if (result.error) {
      return { error: result.error, data: null };
    }

    return { error: null, data: result.data };
  }

  const result = await tryCatch(readLenaProfileById(profileId));
  if (result.error) {
    return { error: result.error, data: null };
  }

  return { error: null, data: result.data };
}

export async function getActiveLenaProfileAction() {
  const result = await tryCatch(readActiveLenaProfile());
  if (result.error) {
    return { error: result.error, data: null };
  }
  return { error: null, data: result.data };
}

export async function deleteLenaProfileAction(profile: LenaProfile) {
  if (profile.profileName === "default") {
    return { error: "You cannot delete the default profile" };
  }

  const sessionData = await GetSessionInServer();
  if (!sessionData) {
    return { error: "Unauthorized. Please login." };
  }

  const hasAccess = await tryCatch(
    CheckPermissionOfUser(sessionData.user.id, "lenaProfile", "delete"),
  );

  if (hasAccess.error) {
    return {
      error: `Error checking permission: ${hasAccess.error}`,
    };
  }

  if (!hasAccess.data.success) {
    return { error: "You do not have permission to delete Lena profile" };
  }

  // If the profile is active, set the default profile as active before deleting
  const activeProfileResult = await tryCatch(readActiveLenaProfile());
  if (activeProfileResult.error) {
    return {
      error: `Failed to get active Lena profile: ${activeProfileResult.error}`,
    };
  }

  const activeProfile = activeProfileResult.data;

  if (activeProfile && activeProfile.id === profile.id) {
    const setDefaultResult = await tryCatch(
      setDefaultProfileActive(sessionData.user.id, sessionData.user.name),
    );

    if (setDefaultResult.error) {
      return {
        error: `Failed to set default profile as active: ${setDefaultResult.error}`,
      };
    }
  }

  const deleteResult = await tryCatch(deleteLenaProfile(profile.id));

  if (deleteResult.error) {
    return { error: `Failed to delete lena profile: ${deleteResult.error}` };
  }

  return { success: true };
}

export async function getTokenUsageAction(limit: number, offset: number) {
  const sessionData = await GetSessionInServer();
  if (!sessionData) {
    return { error: "Unauthorized. Please login." };
  }

  const hasAccess = await tryCatch(
    CheckPermissionOfUser(sessionData.user.id, "lenaAnalytics", "read"),
  );

  if (hasAccess.error) {
    return {
      error: `Error checking permission: ${hasAccess.error}`,
    };
  }

  if (!hasAccess.data.success) {
    return { error: "You do not have permission to view token usage" };
  }

  const result = await tryCatch(readAllTokenUsage(limit, offset));

  if (result.error) {
    return { error: `Failed to fetch token usage: ${result.error}` };
  }

  // Return both data and totalCount
  return { data: result.data.data, totalCount: result.data.totalCount };
}
