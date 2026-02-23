"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { LenaProfile as LenaProfileType } from "@/db/queries/lena-queries";
import {
  createLenaProfileAction,
  updateLenaProfileAction,
  toggleLenaProfileActiveStatusAction,
  deleteLenaProfileAction,
  getAllLenaProfilesAction,
} from "@/actions/chat-actions";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import type { LenaProfiles } from "@/db/schema";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveDialog } from "../responsive-dialog";

const defaultProfile: LenaProfileType = {
  id: "",
  profileName: "default",
  systemPrompt: "",
  topK: 4,
  model: "google/gemini-2.5-pro-preview-03-25",
  threshold: 6,
  thresholdRequiredChunks: 3,
  highConfidenceThreshold: 8,
  requiredHighConfidenceChunks: 1,
};

const models = [
  {
    label: "Gemini 2.5 Pro",
    value: "google/gemini-2.5-pro-preview-03-25",
  },
  {
    label: "Grok 3",
    value: "x-ai/grok-3-beta",
  },
  {
    label: "Grok 4",
    value: "x-ai/grok-4",
  },
  {
    label: "GPT-4.1",
    value: "openai/gpt-4.1",
  },
  {
    label: "GPT-4o",
    value: "openai/gpt-4o",
  },
  {
    label: "GPT-5 Mini",
    value: "openai/gpt-5-mini",
  },
  {
    label: "GPT-5 Pro",
    value: "openai/gpt-5-pro",
  },
  {
    label: "Claude 3.7 Sonnet",
    value: "anthropic/claude-3.7-sonnet",
  },

  {
    label: "Claude Sonnet 4.5",
    value: "anthropic/claude-sonnet-4.5",
  },
  {
    label: "Claude Haiku 4.5",
    value: "anthropic/claude-haiku-4.5",
  },
];

export const LenaConfig = ({
  selectedProfile,
  mutateLenaProfiles,
  setSelectedProfile,
  setOpenDropdown,
}: {
  selectedProfile: LenaProfiles | undefined;
  mutateLenaProfiles: () => void;
  setSelectedProfile: (profile: LenaProfiles) => void;
  setOpenDropdown: (open: boolean) => void;
}) => {
  const mapProfile = useCallback(
    (profile: LenaProfiles | undefined): LenaProfileType =>
      profile
        ? {
            id: profile.id,
            profileName: profile.profileName || "",
            systemPrompt: "",
            topK: profile.topK,
            model: profile.model,
            threshold: profile.threshold,
            thresholdRequiredChunks: profile.thresholdRequiredChunks,
            highConfidenceThreshold: profile.highConfidenceThreshold,
            requiredHighConfidenceChunks: profile.requiredHighConfidenceChunks,
          }
        : defaultProfile,
    [],
  );

  const [profile, setProfile] = useState<LenaProfileType>(
    mapProfile(selectedProfile),
  );
  const [initialProfile, setInitialProfile] = useState<LenaProfileType>(
    mapProfile(selectedProfile),
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openActivateConfirm, setOpenActivateConfirm] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);

  useEffect(() => {
    if (selectedProfile) {
      const mapped = mapProfile(selectedProfile);
      setProfile(mapped);
      setInitialProfile(mapped);
    }
  }, [selectedProfile, mapProfile]);

  const isProfileChanged = () => {
    if (!initialProfile) return false;
    return JSON.stringify(profile) !== JSON.stringify(initialProfile);
  };

  const handleSliderChange = (key: string, value: number[]) => {
    setProfile((prev) => {
      const updatedProfile = { ...prev, [key]: value[0] };

      if (
        key === "threshold" &&
        updatedProfile.highConfidenceThreshold <= value[0]
      ) {
        updatedProfile.highConfidenceThreshold = value[0] + 1;
      }

      return updatedProfile;
    });
  };

  const handleModelChange = (value: string) => {
    setProfile((prev) => ({
      ...prev,
      model: value,
    }));
  };

  const handleResetDefault = () => {
    if (initialProfile) {
      setProfile(initialProfile);
    }
  };

  const handleUpdateConfig = async () => {
    if (selectedProfile?.profileName === "default") {
      toast.error(
        "You cannot update the configuration for the default profile.",
      );
      return;
    }
    setIsUpdating(true);
    try {
      const updatedProfile = await updateLenaProfileAction(profile);

      if (updatedProfile && "error" in updatedProfile) {
        toast.error(updatedProfile.error);
      } else if (updatedProfile) {
        mutateLenaProfiles();
        setSelectedProfile(
          Array.isArray(updatedProfile) ? updatedProfile[0] : updatedProfile,
        );
        toast.success("Configuration updated successfully!");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update configuration. Please try again.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateProfile = async () => {
    setIsCreating(true);
    try {
      const createdProfile = await createLenaProfileAction(profile);
      if (createdProfile && "error" in createdProfile) {
        toast.error(createdProfile.error);
      } else if (createdProfile) {
        await mutateLenaProfiles();

        setSelectedProfile(
          Array.isArray(createdProfile) ? createdProfile[0] : createdProfile,
        );

        toast.success("Profile created successfully!");
      }
    } catch (error) {
      toast.error("Failed to create profile. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!selectedProfile) return;
    setIsDeleting(true);
    try {
      const profileToDelete = mapProfile(selectedProfile);
      const result = await deleteLenaProfileAction(profileToDelete);
      if (result && "error" in result) {
        toast.error(result.error);
      } else {
        setOpenDropdown(false);
        toast.success("Profile deleted successfully!");
        await mutateLenaProfiles();
        const updatedProfiles = await getAllLenaProfilesAction();
        if (updatedProfiles && !("error" in updatedProfiles)) {
          const defaultProfile = updatedProfiles.find(
            (p: LenaProfiles) => p.profileName === "default",
          );
          if (defaultProfile) {
            setSelectedProfile(defaultProfile);
          }
        }
      }
    } catch (error) {
      toast.error("Failed to delete profile. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full h-full">
      {selectedProfile && selectedProfile?.profileName !== "default" ? (
        <div className="flex flex-col p-4 border-b border-border bg-muted-foreground/10">
          <p className="text-sm text-muted-foreground">
            Configure Lena AI profile:{" "}
            <span className="font-bold text-foreground">
              {selectedProfile?.profileName}
            </span>{" "}
            to choose its LLM model and configure its knowledge base
            functionality.
          </p>
          <p className="text-xs self-end text-end text-muted-foreground mt-2 py-1 bg-muted-foreground/10 px-2 rounded-md w-fit border border-border/50 flex flex-row gap-2 items-center">
            <AlertCircle className="h-3 w-3" />
            Created by{" "}
            <span className="font-medium text-foreground">
              {selectedProfile?.createdByName}
            </span>{" "}
            on{" "}
            <span className="font-medium text-foreground">
              {selectedProfile?.createdAt
                ? new Date(selectedProfile.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  )
                : "N/A"}{" "}
            </span>{" "}
          </p>
        </div>
      ) : selectedProfile?.profileName === "default" ? (
        <div className="flex flex-col p-4 border-b border-border bg-muted-foreground/10">
          <p className="text-sm text-muted-foreground">
            This is the default profile. You cannot update or delete it. But you
            can use it to create a new profile.
          </p>
        </div>
      ) : (
        <div className="flex flex-col p-4 border-b border-border bg-muted-foreground/10">
          <p className="text-sm text-muted-foreground">
            Create a new profile for Lena AI to use.
          </p>
        </div>
      )}

      <div className="space-y-3  overflow-auto sidebar-scrollbar max-h-[60vh] p-4  w-full">
        <div className="border border-border p-3 bg-muted-foreground/10 rounded-md flex flex-row gap-2 items-center">
          <div className="flex flex-col gap-2 w-full ">
            <div className="flex flex-row gap-2 items-center">
              <Label>Production Profile</Label>

              {selectedProfile?.active && (
                <div className="text-[11px] text-black bg-green-500 rounded-lg px-1.5 py-[1px]">
                  Live
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              When enabled, the profile will be used for all new chats on the
              website and Ibben mobile app for users.
            </p>
          </div>
          <Switch
            id="setActive"
            className="cursor-pointer"
            checked={selectedProfile?.active || false}
            disabled={selectedProfile?.active}
            onCheckedChange={(checked) => {
              if (selectedProfile && !selectedProfile.active && checked) {
                setOpenActivateConfirm(true);
              }
            }}
          />
        </div>
        <div className="space-y-2 border border-border p-3 bg-muted-foreground/10 rounded-md flex flex-row gap-2">
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="profileName">Profile Name</Label>
            <Input
              type="text"
              placeholder="Enter profile name"
              value={profile.profileName}
              onChange={(e) =>
                setProfile({ ...profile, profileName: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="model">LLM Model</Label>
            <Select value={profile.model} onValueChange={handleModelChange}>
              <SelectTrigger id="model" className="bg-background">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* 
				<div className="space-y-2 border border-border p-3 bg-muted-foreground/10 rounded-md">
					<Label htmlFor="profileName">Lena System Prompt</Label>
					<Textarea
						placeholder="Enter system prompt"
						value={profile.systemPrompt}
						onChange={(e) =>
							setProfile({ ...profile, systemPrompt: e.target.value })
						}
					/>
				</div> */}

        <Collapsible
          open={isAdvancedSettingsOpen}
          onOpenChange={setIsAdvancedSettingsOpen}
        >
          <CollapsibleTrigger asChild>
            <div className="flex flex-row gap-2 items-center mx-auto justify-center bg-muted-foreground/10 mt-4 px-3 py-1 rounded-md w-fit cursor-pointer text-muted-foreground hover:text-foreground">
              <p className="text-xs ">
                {isAdvancedSettingsOpen
                  ? "Hide Advanced Settings"
                  : "View Advanced Settings"}
              </p>
              {isAdvancedSettingsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-4">
            <Label htmlFor="profileName">
              Lena Knowledge Base Functionality
            </Label>
            <p className="text-xs text-muted-foreground">
              When Lena AI receives detailed questions, it retrieves relevant
              text snippets from the knowledge base to provide accurate and
              informed responses.
            </p>
            <p className="text-xs text-muted-foreground">
              The knowledge base consists of four document categories:{" "}
              <span className="font-medium text-foreground">Books</span>,{" "}
              <span className="font-medium text-foreground">Laws</span>,{" "}
              <span className="font-medium text-foreground">Legal Cases</span>,
              and <span className="font-medium text-foreground">Other</span>.
            </p>
            <div className="space-y-2 border border-border p-3 bg-muted-foreground/10 rounded-md">
              <p className="text-xs text-muted-foreground">
                Adjust the slider below to specify how many information snippets
                Lena AI should retrieve from each document category.
              </p>
              <div className="flex justify-between items-center">
                <Label htmlFor="topK" className="text-xs">
                  Information Snippets per Category: {profile.topK}
                </Label>
                <span className="font-medium text-xs text-foreground/80 italic">
                  recommended: 4
                </span>
              </div>
              <div className="pt-1 pb-2">
                <Slider
                  id="topK"
                  min={1}
                  max={20}
                  step={1}
                  value={[profile.topK]}
                  onValueChange={(value) => handleSliderChange("topK", value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Lena AI will retrieve{" "}
                <span className="font-bold text-foreground">
                  {profile.topK}
                </span>{" "}
                snippets from each category, totaling{" "}
                <span className="font-bold text-foreground">
                  {profile.topK * 4}
                </span>{" "}
                snippets.
                <br />
                <span className="font-medium text-xs text-foreground">
                  [{profile.topK} x 4 = {profile.topK * 4} snippets]
                </span>
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Lena AI evaluates each of the{" "}
              <span className="font-bold text-foreground">
                {profile.topK * 4}
              </span>{" "}
              retrieved snippets on a scale from 1 to 10. This{" "}
              <span className="font-medium text-foreground">
                confidence score
              </span>{" "}
              indicates how relevant and useful each snippet is to the user's
              query, with higher scores representing better matches.
            </p>

            <p className="text-xs text-muted-foreground">
              Based on these confidence scores, Lena AI determines whether it
              has sufficient information to confidently answer the user's
              question.
            </p>

            <p className="text-xs text-muted-foreground">
              You can configure the minimum confidence score and the minimum
              number of snippets required to meet or exceed this score.
            </p>

            <p className="text-xs text-muted-foreground">
              Additionally, you can set a higher confidence threshold and
              specify the minimum number of snippets required to meet or exceed
              this higher threshold.
            </p>

            <p className="text-xs text-muted-foreground">
              Lena AI will only respond to the user's question if both
              conditions are satisfied; otherwise, it will indicate that
              additional information from an admin is needed.
            </p>

            <div className="flex flex-row gap-2">
              <div className="space-y-2 border border-border p-3 bg-muted-foreground/10 rounded-md w-1/2">
                <Label htmlFor="threshold">
                  Minimum Confidence Score: {profile.threshold}
                </Label>
                <div className="pt-1 pb-2">
                  <Slider
                    id="threshold"
                    min={1}
                    max={10}
                    step={1}
                    value={[Math.min(Math.max(profile.threshold, 4), 8)]}
                    onValueChange={(value) =>
                      handleSliderChange("threshold", [
                        Math.min(Math.max(value[0], 4), 8),
                      ])
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Allowed range:{" "}
                  <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium">
                    4 to 8
                  </span>
                </p>
                <hr className="my-3 border-border/60" />
                <Label htmlFor="thresholdRequiredChunks">
                  Snippets Required: {profile.thresholdRequiredChunks}
                </Label>
                <div className="pt-1 pb-2">
                  <Slider
                    id="thresholdRequiredChunks"
                    min={1}
                    max={profile.topK * 4}
                    step={1}
                    value={[profile.thresholdRequiredChunks]}
                    onValueChange={(value) =>
                      handleSliderChange("thresholdRequiredChunks", value)
                    }
                  />
                </div>
                <hr className="my-3 border-border/60" />
                <Label>Condition 1 </Label>
                <p className="text-xs text-muted-foreground">
                  At least{" "}
                  <span className="font-bold text-foreground">
                    {profile.thresholdRequiredChunks}
                  </span>{" "}
                  snippets must have a confidence score of{" "}
                  <span className="font-bold text-foreground">
                    {profile.threshold}
                  </span>{" "}
                  or higher.
                </p>
              </div>

              <div className="space-y-2 border border-border p-3 bg-muted-foreground/10 rounded-md w-1/2">
                <Label htmlFor="highConfidenceThreshold">
                  High Confidence Score: {profile.highConfidenceThreshold}
                </Label>
                <div className="pt-1 pb-2">
                  <Slider
                    id="highConfidenceThreshold"
                    min={1}
                    max={10}
                    step={1}
                    value={[
                      Math.min(
                        Math.max(
                          profile.highConfidenceThreshold,
                          profile.threshold + 1,
                        ),
                        9,
                      ),
                    ]}
                    onValueChange={(value) =>
                      handleSliderChange("highConfidenceThreshold", [
                        Math.min(Math.max(value[0], profile.threshold + 1), 9),
                      ])
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Allowed range:{" "}
                  <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium">
                    {profile.threshold + 1 === 9
                      ? "9"
                      : profile.threshold + 1 === 8
                        ? "8 or 9"
                        : `${profile.threshold + 1} to 9`}
                  </span>
                </p>
                <hr className="my-3 border-border/60" />
                <Label htmlFor="requiredHighConfidenceChunks">
                  Snippets Required: {profile.requiredHighConfidenceChunks}
                </Label>
                <div className="pt-1 pb-2">
                  <Slider
                    id="requiredHighConfidenceChunks"
                    min={0}
                    max={profile.topK * 4}
                    step={1}
                    value={[profile.requiredHighConfidenceChunks]}
                    onValueChange={(value) =>
                      handleSliderChange("requiredHighConfidenceChunks", value)
                    }
                  />
                </div>
                <hr className="my-3 border-border/60" />
                <Label>Condition 2 </Label>
                <p className="text-xs text-muted-foreground">
                  At least{" "}
                  <span className="font-bold text-foreground">
                    {profile.requiredHighConfidenceChunks}
                  </span>{" "}
                  snippets must have a confidence score of{" "}
                  <span className="font-bold text-foreground">
                    {profile.highConfidenceThreshold}
                  </span>{" "}
                  or higher.
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="flex justify-between items-center gap-2 w-full border-t border-border p-4 bg-muted-foreground/10">
        <div className="flex flex-row gap-2">
          {selectedProfile && selectedProfile?.profileName !== "default" && (
            <ResponsiveDialog
              open={openDelete}
              onOpenChange={setOpenDelete}
              trigger={
                <Button
                  variant="destructive"
                  className="bg-destructive/40 text-destructive-foreground font-normal border-dashed border-destructive hover:text-foreground border hover:bg-destructive"
                >
                  Delete
                </Button>
              }
              title="Delete Customer"
              description="This action is irreversible"
              className="sm:max-w-md"
            >
              <div className="flex flex-col gap-4 p-4">
                <div className="flex items-start gap-3 p-3 bg-destructive/20 rounded-md border border-destructive/20 text-red-500">
                  <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    Please confirm that you want to delete this profile.
                  </p>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    variant="outline"
                    onClick={() => setOpenDelete(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={isDeleting}
                    onClick={handleDeleteProfile}
                  >
                    {isDeleting ? "Deleting..." : "Delete Customer"}
                  </Button>
                </div>
              </div>
            </ResponsiveDialog>
          )}
          {isProfileChanged() && (
            <Button
              variant="outline"
              onClick={handleResetDefault}
              disabled={!isProfileChanged()}
            >
              Reset
            </Button>
          )}
        </div>
        <div className="flex flex-row gap-2">
          {selectedProfile && selectedProfile?.profileName !== "default" && (
            <Button
              onClick={handleUpdateConfig}
              disabled={isUpdating || !isProfileChanged()}
              className={cn(
                selectedProfile?.profileName === "default" && "hidden",
              )}
            >
              {isUpdating ? (
                <div className="flex flex-row gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </div>
              ) : (
                "Update Profile"
              )}
            </Button>
          )}
          <Button onClick={handleCreateProfile} disabled={isCreating}>
            {isCreating ? (
              <div className="flex flex-row gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </div>
            ) : (
              "Create New Profile"
            )}
          </Button>
        </div>
      </div>

      <ResponsiveDialog
        open={openActivateConfirm}
        onOpenChange={(open) => {
          if (!isTogglingActive) setOpenActivateConfirm(open);
        }}
        trigger={null}
        title="Set as Production Profile"
        description={
          "Activating this profile will deactivate the current production profile and set this one as the new production profile for all users."
        }
        className="sm:max-w-md"
      >
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-start gap-3 rounded-md border border-border/20 text-foreground">
            <p className="text-sm">
              Are you sure you want to set this profile as the production
              profile? The "current active" profile will be deactivated.
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setOpenActivateConfirm(false)}
              disabled={isTogglingActive}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              disabled={isTogglingActive}
              onClick={async () => {
                if (!selectedProfile) return;
                setIsTogglingActive(true);
                try {
                  const result = await toggleLenaProfileActiveStatusAction(
                    selectedProfile.id,
                    true,
                  );
                  if (result && "error" in result) {
                    toast.error(result.error);
                  } else {
                    await mutateLenaProfiles();
                    toast.success("Profile set as production successfully!");
                  }
                } catch {
                  toast.error("Failed to set as production profile");
                } finally {
                  setIsTogglingActive(false);
                  setOpenActivateConfirm(false);
                }
              }}
            >
              {isTogglingActive ? (
                <div className="flex flex-row gap-2 items-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting as production profile...
                </div>
              ) : (
                "Set as production profile"
              )}
            </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </div>
  );
};
