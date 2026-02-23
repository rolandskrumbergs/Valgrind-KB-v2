import { eq, desc, count } from "drizzle-orm";
import { db } from "..";
import { lenaProfiles, tokenUsage } from "../schema";

export type LenaProfile = {
  id: string;
  profileName: string;
  systemPrompt?: string;
  topK: number;
  model: string;
  threshold: number;
  thresholdRequiredChunks: number;
  highConfidenceThreshold: number;
  requiredHighConfidenceChunks: number;
};

export async function updateLenaProfile(
  profile: LenaProfile,
  updatedBy: string,
  updatedByName: string,
) {
  return await db
    .update(lenaProfiles)
    .set({
      ...profile,
      updatedAt: new Date(),
      updatedBy,
      updatedByName,
    })
    .where(eq(lenaProfiles.id, profile.id))
    .returning();
}

export async function insertLenaProfile(
  profile: LenaProfile,
  createdBy: string,
  createdByName: string,
) {
  const { id, ...profileWithoutId } = profile;

  return await db
    .insert(lenaProfiles)
    .values({
      ...profileWithoutId,
      createdAt: new Date(),
      createdBy,
      createdByName,
      updatedAt: new Date(),
      updatedBy: createdBy,
      updatedByName: createdByName,
    })
    .returning();
}

export async function readLenaProfileById(id: string) {
  return await db.query.lenaProfiles.findFirst({
    where: eq(lenaProfiles.id, id),
  });
}

export async function readActiveLenaProfile() {
  return await db.query.lenaProfiles.findFirst({
    where: eq(lenaProfiles.active, true),
  });
}

export async function readAllLenaProfiles() {
  return await db.query.lenaProfiles.findMany({
    orderBy: [desc(lenaProfiles.createdAt)],
  });
}

export async function readLenaProfileByName(profileName: string) {
  return await db.query.lenaProfiles.findFirst({
    where: eq(lenaProfiles.profileName, profileName),
  });
}

export async function deleteLenaProfile(id: string) {
  return await db.delete(lenaProfiles).where(eq(lenaProfiles.id, id));
}

export async function setAllProfilesInactive(
  updatedBy: string,
  updatedByName: string,
) {
  return await db.update(lenaProfiles).set({
    active: false,
    updatedAt: new Date(),
    updatedBy,
    updatedByName,
  });
}

export async function setDefaultProfileActive(
  updatedBy: string,
  updatedByName: string,
) {
  return await db
    .update(lenaProfiles)
    .set({
      active: true,
      updatedAt: new Date(),
      updatedBy,
      updatedByName,
    })
    .where(eq(lenaProfiles.profileName, "default"));
}

export async function updateProfileActiveStatus(
  id: string,
  active: boolean,
  updatedBy: string,
  updatedByName: string,
) {
  return await db
    .update(lenaProfiles)
    .set({
      active,
      updatedAt: new Date(),
      updatedBy,
      updatedByName,
    })
    .where(eq(lenaProfiles.id, id));
}

export async function readAllTokenUsage(limit: number, offset: number) {
  const data = await db.query.tokenUsage.findMany({
    orderBy: [desc(tokenUsage.createdAt)],
    limit,
    offset,
    with: {
      chat: {
        columns: {
          title: true,
        },
      },
      message: {
        // Fetching parts as content is stored there
        columns: {
          parts: true,
        },
      },
      user: {
        columns: {
          name: true,
        },
      },
    },
  });

  const totalCountResult = await db.select({ count: count() }).from(tokenUsage);

  const totalCount = totalCountResult[0]?.count ?? 0;

  return { data, totalCount };
}
