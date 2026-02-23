"use client";

import React, { useState } from "react";
import { AlertTriangle, Upload, Loader2 } from "lucide-react";
import {
  useForm,
  type FieldErrors,
  type SubmitHandler,
  Controller,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Tiptap from "@/components/news/tiptap-editor";

import {
  uploadCourseImageAction,
  createCourseAction,
  updateCourseAction,
} from "@/actions/courses-actions";
import {
  BasicCourseInfoSchema,
  type BasicCourseInfoFormData,
} from "./form-schema";

// Helper: Submit Button
interface SmartSubmitButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  readonly text: string;
  readonly pendingText: string;
  readonly isSubmitting: boolean;
}

function SmartSubmitButton({
  text,
  pendingText,
  className,
  variant,
  isSubmitting,
  ...props
}: Readonly<SmartSubmitButtonProps>) {
  return (
    <Button
      type="submit"
      disabled={isSubmitting}
      className={className}
      variant={variant}
      {...props}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {pendingText}
        </>
      ) : (
        text
      )}
    </Button>
  );
}

interface CourseBasicInformationFormProps {
  readonly currentCourseId: number | null;
  readonly initialData?: {
    title: string;
    description: string | null;
    price: number;
    imageUrl?: string | null;
    status: string;
    certificateEnabled?: boolean;
  };
  readonly setCurrentCourseId: (id: number | null) => void;
  readonly setActiveTabKey: (key: "info" | "chapters") => void;
}

export function CourseBasicInformationForm({
  currentCourseId,
  initialData,
  setCurrentCourseId,
  setActiveTabKey,
}: Readonly<CourseBasicInformationFormProps>) {
  const router = useRouter();

  // Move all state from parent to here
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] =
    useState<FieldErrors<BasicCourseInfoFormData> | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl || null,
  );

  const form = useForm<BasicCourseInfoFormData>({
    resolver: zodResolver(BasicCourseInfoSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      imageUrl: initialData?.imageUrl || "",
      status: "draft",
      certificateEnabled: initialData?.certificateEnabled ?? true,
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors: clientErrors, isSubmitting: rhfIsSubmitting },
    setValue,
    getValues,
  } = form;

  const onBasicInfoSubmit: SubmitHandler<BasicCourseInfoFormData> = async (
    formData,
  ): Promise<void> => {
    setIsSubmitting(true);
    setServerError(null);
    setServerFieldErrors(null);

    // Convert undefined to null for imageUrl
    const preparedData = {
      ...formData,
      imageUrl: formData.imageUrl || null,
    };

    if (currentCourseId) {
      const response = await updateCourseAction({
        courseId: currentCourseId,
        ...preparedData,
      });

      setIsSubmitting(false);

      if (response.success) {
        toast.success("Course updated!");
      } else {
        const errorMessage = response.error || "Failed to update course.";
        toast.error(errorMessage);
        setServerError(errorMessage);
      }
    } else {
      const response = await createCourseAction(preparedData);

      setIsSubmitting(false);

      if (response.success && response.data?.courseId) {
        toast.success("Course created!");
        const newCourseId = response.data.courseId;
        setCurrentCourseId(newCourseId);
        setActiveTabKey("chapters");
        router.replace(`edit/${newCourseId}`, { scroll: false });
      } else {
        const errorMessage = response.error || "Failed to create course.";
        toast.error(errorMessage);
        setServerError(errorMessage);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      toast.error("Please select only PNG or JPEG images");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be less than 4MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    toast.loading("Uploading image...", { id: "image-upload" });

    try {
      const uploadResult = await uploadCourseImageAction(file);

      if (uploadResult.success && uploadResult.data?.s3ImageUrl) {
        setValue("imageUrl", uploadResult.data.s3ImageUrl, {
          shouldValidate: true,
        });
        toast.success("Image uploaded!", { id: "image-upload" });
      } else {
        toast.error(uploadResult.error || "Image upload failed", {
          id: "image-upload",
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error during image upload", {
        id: "image-upload",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Course Information</CardTitle>
        <CardDescription>
          Fill in the essential details for your course.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onBasicInfoSubmit)}>
        <CardContent className="space-y-6">
          {serverError && (
            <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded-md flex items-start gap-2 text-sm">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <p>{serverError}</p>
            </div>
          )}
          {/* Input fields for basic info */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Course Title</Label>
            <Input id="title" {...register("title")} />
            {clientErrors.title && (
              <p className="text-sm text-destructive">
                {clientErrors.title.message}
              </p>
            )}
            {serverFieldErrors?.title && (
              <p className="text-sm text-destructive">
                {(serverFieldErrors.title as { message?: string }).message ||
                  "Invalid title"}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="image-upload">Course Image</Label>
            <div className="border rounded-md border-dashed border-gray-300 overflow-hidden">
              {imagePreview ? (
                <label
                  htmlFor="image-upload"
                  className="flex w-full cursor-pointer flex-row items-center justify-center gap-2 p-8 h-full"
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center text-sm py-1">
                    Click to change
                  </div>
                  <Input
                    id="image-upload"
                    type="file"
                    accept=".png,.jpeg,.jpg"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <label
                  htmlFor="image-upload"
                  className="flex w-full cursor-pointer flex-row items-center justify-center gap-2 p-8 h-full"
                >
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      Click to upload image
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      PNG or JPEG (max. 4MB)
                    </p>
                  </div>
                  <Input
                    id="image-upload"
                    type="file"
                    accept=".png,.jpeg,.jpg"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Course Description</Label>
            <Tiptap
              content={getValues("description")}
              onChange={(value) => {
                setValue("description", value, { shouldValidate: true });
              }}
              form={form as any}
            />
            {clientErrors.description && (
              <p className="text-sm text-destructive">
                {clientErrors.description.message}
              </p>
            )}
            {serverFieldErrors?.description && (
              <p className="text-sm text-destructive">
                {(serverFieldErrors.description as { message?: string })
                  .message || "Invalid description"}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
              />
              {clientErrors.price && (
                <p className="text-sm text-destructive">
                  {clientErrors.price.message}
                </p>
              )}
              {serverFieldErrors?.price && (
                <p className="text-sm text-destructive">
                  {(serverFieldErrors.price as { message?: string }).message ||
                    "Invalid price"}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="certificateEnabled">Certificate</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Controller
                  name="certificateEnabled"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="certificateEnabled"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label
                  htmlFor="certificateEnabled"
                  className="text-sm font-normal text-muted-foreground"
                >
                  Provides certificate upon completion
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <SmartSubmitButton
            isSubmitting={isSubmitting || rhfIsSubmitting}
            text={currentCourseId ? "Save Changes" : "Save and Continue"}
            pendingText="Saving..."
            className="ml-auto"
          />
        </CardFooter>
      </form>
    </Card>
  );
}
