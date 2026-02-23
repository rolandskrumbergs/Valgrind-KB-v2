"use client";
import React, { useState } from "react";

import { Info, ListVideo } from "lucide-react";
import { Toaster, toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CourseBasicInformationForm } from "./course-basic-information-form";
import { CourseChapters, type ChapterClientState } from "./course-chapters";

interface CourseFormProps {
  readonly initialData?: {
    courseId: number; // Using number for consistency with DB
    title: string;
    description: string | null;
    price: number;
    imageUrl?: string | null;
    status: string;
    certificateEnabled: boolean;
    chapters: ChapterClientState[];
  };
}

export function CourseForm({ initialData }: CourseFormProps) {
  const [activeTabKey, setActiveTabKey] = useState<"info" | "chapters">("info");
  const [currentCourseId, setCurrentCourseId] = useState<number | null>(
    initialData?.courseId || null,
  );

  const [chapters, setChapters] = useState<ChapterClientState[]>(
    initialData?.chapters || [],
  );

  return (
    <>
      <Toaster richColors position="top-right" />
      <Tabs
        value={activeTabKey}
        onValueChange={(value) => setActiveTabKey(value as "info" | "chapters")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex mb-6">
          <TabsTrigger key="TabsTrigger1" value="info" className="px-6">
            <Info className="mr-2 h-4 w-4" /> Information
          </TabsTrigger>
          <TabsTrigger
            key="TabsTrigger2"
            value="chapters"
            disabled={!currentCourseId}
            className="px-6"
            onClick={() => {
              if (!currentCourseId)
                toast.info("Save course info first to manage chapters.");
            }}
          >
            <ListVideo className="mr-2 h-4 w-4" /> Chapters
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <CourseBasicInformationForm
            currentCourseId={currentCourseId}
            initialData={
              initialData
                ? {
                    title: initialData.title,
                    description: initialData.description,
                    price: initialData.price,
                    imageUrl: initialData.imageUrl,
                    status: initialData.status,
                    certificateEnabled: initialData.certificateEnabled,
                  }
                : undefined
            }
            setCurrentCourseId={setCurrentCourseId}
            setActiveTabKey={setActiveTabKey}
          />
        </TabsContent>

        <TabsContent value="chapters">
          <CourseChapters
            chapters={chapters}
            setChapters={setChapters}
            currentCourseId={currentCourseId}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
