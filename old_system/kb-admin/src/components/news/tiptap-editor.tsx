"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import {
	Bold,
	Heading1,
	Heading2,
	Italic,
	Link2,
	List,
	ListOrdered,
	Strikethrough,
	UnderlineIcon,
} from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";
import { Label } from "../ui/label";
import type { UseFormReturn } from "react-hook-form";
import type { AddNewsFormType } from "@/schema";

interface TiptapProps {
	content?: string;
	onChange?: (content: string) => void;
	form?: UseFormReturn<AddNewsFormType>;
}

const ButtonGroup = ({ children }: { children: React.ReactNode }) => {
	return <div className="flex items-center gap-0.5">{children}</div>;
};

const ToolbarButton = ({
	onClick,
	isActive,
	children,
}: {
	onClick: () => void;
	isActive?: boolean;
	children: React.ReactNode;
}) => {
	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				onClick();
			}}
			className={`h-8 px-2 hover:bg-muted-foreground/20 hover:text-zinc-100 ${
				isActive ? "bg-muted-foreground/20 text-zinc-100" : "text-zinc-400"
			}`}
		>
			{children}
		</Button>
	);
};

const Tiptap = ({ content = "", onChange, form }: TiptapProps) => {
	const [isFocused, setIsFocused] = useState(false);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: false,
				bulletList: {
					HTMLAttributes: {
						class: "list-disc ml-4",
					},
				},
				orderedList: {
					HTMLAttributes: {
						class: "list-decimal ml-4",
					},
				},
			}),
			Heading.configure({
				levels: [1, 2],
			}),
			Underline,
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: "text-primary underline",
				},
			}),
		],
		content: content,
		editorProps: {
			attributes: {
				class:
					"prose prose-invert max-w-none min-h-[200px] focus:outline-none p-4 overflow-y-auto [&_ul]:list-disc [&_ol]:list-decimal [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold",
			},
			handleDOMEvents: {
				focus: () => {
					setIsFocused(true);
					return false;
				},
				blur: () => {
					setIsFocused(false);
					return false;
				},
			},
		},
		onUpdate: ({ editor }) => {
			const html = editor.getHTML();
			// Sanitize HTML before sending it to parent
			const sanitizedHtml = DOMPurify.sanitize(html, {
				ALLOWED_TAGS: [
					"p",
					"br",
					"strong",
					"em",
					"u",
					"s",
					"h1",
					"h2",
					"ul",
					"ol",
					"li",
					"a",
					"blockquote",
					"code",
					"pre",
				],
				ALLOWED_ATTR: ["href", "class"],
			});
			onChange?.(sanitizedHtml);
		},
	});

	// Update editor content when content prop changes
	useEffect(() => {
		if (editor && content && editor.getHTML() !== content) {
			editor.commands.setContent(content);
		}
	}, [content, editor]);

	const setLink = useCallback(() => {
		if (!editor) {
			return;
		}

		if (editor.isActive("link")) {
			editor.chain().focus().unsetLink().run();
			return;
		}

		const previousUrl = editor.getAttributes("link").href;
		const url = window.prompt("URL", previousUrl);

		// cancelled
		if (url === null) {
			return;
		}

		// empty
		if (url === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
			return;
		}

		// update link
		try {
			editor
				.chain()
				.focus()
				.extendMarkRange("link")
				.setLink({ href: url })
				.run();
		} catch (error) {
			if (error instanceof Error) {
				alert(error.message);
			} else {
				alert("An error occurred while setting the link");
			}
		}
	}, [editor]);

	if (!editor) {
		return null;
	}

	return (
		<div className="space-y-2">
			<div className="flex flex-row gap-1 items-center">
				<Label htmlFor="content" className="font-medium text-foreground">
					Content
				</Label>
				{form?.formState.errors.content && (
					<p className="text-xs text-white bg-destructive px-2 rounded-full ">
						{form?.formState.errors.content.message}
					</p>
				)}
			</div>
			<div
				className={cn(
					"flex w-full flex-col overflow-hidden rounded-lg border border-muted-foreground/20 bg-primary-foreground transition-all",
					isFocused ? "ring-[3px] ring-ring/50 ring-offset-0 border-ring" : "",
					form?.formState.errors.content
						? "border-destructive bg-destructive/10"
						: "",
				)}
			>
				<div className="flex items-center gap-1 border-b border-muted-foreground/20 px-1 py-1">
					<ButtonGroup>
						<ToolbarButton
							onClick={() => editor.chain().focus().toggleBold().run()}
							isActive={editor.isActive("bold")}
						>
							<Bold className="h-4 w-4" />
						</ToolbarButton>
						<ToolbarButton
							onClick={() => editor.chain().focus().toggleItalic().run()}
							isActive={editor.isActive("italic")}
						>
							<Italic className="h-4 w-4" />
						</ToolbarButton>
						<ToolbarButton
							onClick={() => editor.chain().focus().toggleStrike().run()}
							isActive={editor.isActive("strike")}
						>
							<Strikethrough className="h-4 w-4" />
						</ToolbarButton>
						<ToolbarButton
							onClick={() => editor.chain().focus().toggleUnderline().run()}
							isActive={editor.isActive("underline")}
						>
							<UnderlineIcon className="h-4 w-4" />
						</ToolbarButton>
					</ButtonGroup>

					<Separator
						orientation="vertical"
						className="mx-1 h-6 w-px bg-muted-foreground/20"
					/>

					<ButtonGroup>
						<ToolbarButton
							onClick={() => {
								editor.chain().focus().toggleHeading({ level: 1 }).run();
							}}
							isActive={editor.isActive("heading", { level: 1 })}
						>
							<Heading1 className="h-4 w-4" />
						</ToolbarButton>
						<ToolbarButton
							onClick={() => {
								editor.chain().focus().toggleHeading({ level: 2 }).run();
							}}
							isActive={editor.isActive("heading", { level: 2 })}
						>
							<Heading2 className="h-4 w-4" />
						</ToolbarButton>
					</ButtonGroup>

					<Separator
						orientation="vertical"
						className="mx-1 h-6 w-px bg-muted-foreground/20"
					/>

					<ButtonGroup>
						<ToolbarButton onClick={setLink} isActive={editor.isActive("link")}>
							<Link2 className="h-4 w-4" />
						</ToolbarButton>
					</ButtonGroup>

					<Separator
						orientation="vertical"
						className="mx-1 h-6 w-px bg-muted-foreground/20"
					/>

					<ButtonGroup>
						<ToolbarButton
							onClick={() => {
								editor.chain().focus().toggleBulletList().run();
							}}
							isActive={editor.isActive("bulletList")}
						>
							<List className="h-4 w-4" />
						</ToolbarButton>
						<ToolbarButton
							onClick={() => {
								editor.chain().focus().toggleOrderedList().run();
							}}
							isActive={editor.isActive("orderedList")}
						>
							<ListOrdered className="h-4 w-4" />
						</ToolbarButton>
					</ButtonGroup>
				</div>

				<div className="relative min-h-[250px]">
					<EditorContent
						editor={editor}
						className="absolute inset-0 text-sm [&_.ProseMirror]:h-full [&_.ProseMirror]:min-h-[250px] [&_.ProseMirror]:outline-none "
					/>
				</div>
			</div>
		</div>
	);
};

export default Tiptap;
