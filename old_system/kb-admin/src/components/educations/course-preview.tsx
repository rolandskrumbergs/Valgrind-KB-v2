// components/educations/course-preview.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ChapterClientState } from './course-form'

interface CoursePreviewProps {
  courseData: {
    id: string;
    title: string;
    description: string;
    price: number;
    imageUrl?: string;
    chapters: ChapterClientState[];
  } | null;
}

export default function CoursePreview({ courseData }: CoursePreviewProps) {
  if (!courseData) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>No course data available for preview.</p>
        <p className="text-sm">Please save the course information and add chapters.</p>
      </div>
    );
  }

  const { title, description, imageUrl, price, chapters } = courseData;

  return (
    <div className="space-y-6">
      {/* Блок с основной информацией о курсе */}
      <Card>
        {imageUrl && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={title} className="object-cover w-full h-full" />
          </div>
        )}
        <CardHeader>
          <CardTitle className="text-3xl">{title || "Course Title"}</CardTitle>
          {price > 0 && (
            <p className="text-xl font-semibold text-primary">${price.toFixed(2)}</p>
          )}
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold mb-2 mt-4">Course Description</h3>
          <div
            className="prose prose-sm dark:prose-invert max-w-none" // Добавил dark:prose-invert для темной темы
            dangerouslySetInnerHTML={{ __html: description?.replace(/\n/g, '<br />') || "No description provided." }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course Content</CardTitle>
          <CardDescription>Review the chapters and their content below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {chapters && chapters.length > 0 ? (
            chapters.map((chapter, index) => (
              <div key={chapter.id || chapter.tempId || `chapter-${index}`}>
                {index > 0 && <Separator className="my-6" />}

                <h3 className="text-xl font-semibold mb-2">
                  <span className="text-muted-foreground mr-2">{index + 1}.</span>
                  {chapter.title || "Chapter Title"}
                </h3>
                {chapter.description && (
                  <p className="text-muted-foreground mb-4 text-sm">
                    {chapter.description}
                  </p>
                )}

                {/* Отображение видео, если есть */}
                {chapter.videoUrl && (
                  <div className="my-4 p-4 border rounded-md bg-muted/30">
                    <p className="font-semibold text-md mb-2">Video Content:</p>
                    {/* Можно улучшить отображение видео, например, встроить плеер, если URL это позволяет */}
                    <a
                      href={chapter.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline hover:text-blue-800 transition-colors"
                    >
                      Watch Video: {chapter.videoUrl}
                    </a>
                    {/* Пример встраивания (если это YouTube или подобный сервис):
                    <div className="aspect-video mt-2">
                      <iframe
                        src={chapter.videoUrl} // Убедитесь, что URL подходит для iframe
                        title={chapter.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full rounded-md border"
                      ></iframe>
                    </div>
                    */}
                  </div>
                )}

                {chapter.questions && chapter.questions.length > 0 && (
                  <div className="mt-4 p-4 border rounded-md bg-muted/30">
                    <h4 className="font-semibold text-md mb-3">Questions:</h4>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                      {chapter.questions.map((question, qIndex) => (
                        <li key={question.id || `q-${index}-${qIndex}`}>
                          {question.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!chapter.videoUrl && (!chapter.questions || chapter.questions.length === 0) && (
                  <p className="text-sm text-muted-foreground italic mt-2">
                    This chapter currently has no specific content (like video or questions) listed.
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No chapters have been added to this course yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}