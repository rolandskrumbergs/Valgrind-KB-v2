import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import type { Organization, CreateOrganizationRequest } from "@/lib/api";

const addOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactInfo: z.string().optional(),
  invoiceInfo: z.string().optional(),
  maxSeats: z.number().int().min(1, "Must have at least 1 seat"),
});

type AddOrganizationFormValues = z.infer<typeof addOrganizationSchema>;

interface AddOrganizationFormProps {
  setOpen: (open: boolean) => void;
  onCreate: (req: CreateOrganizationRequest) => Promise<{ data?: Organization; error?: string }>;
}

export function AddOrganizationForm({ setOpen, onCreate }: Readonly<AddOrganizationFormProps>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrganization, setCreatedOrganization] = useState<Organization | null>(null);

  const form = useForm<AddOrganizationFormValues>({
    resolver: zodResolver(addOrganizationSchema),
    defaultValues: {
      name: "",
      contactInfo: "",
      invoiceInfo: "",
      maxSeats: 1,
    },
  });

  const onSubmit = async (data: AddOrganizationFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await onCreate({
        name: data.name,
        maxSeats: data.maxSeats,
        contactInfo: data.contactInfo || undefined,
        invoiceInfo: data.invoiceInfo || undefined,
      });
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        toast.success("Organization created successfully");
        setCreatedOrganization(result.data);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create organization"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdOrganization) {
    return (
      <div className="flex flex-col">
        <div className="flex flex-col items-center justify-center p-8 gap-4">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
          <h2 className="text-xl font-bold">Organization Created Successfully</h2>
          <div className="w-full space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{createdOrganization.name}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Contact Info:</span>
              <span className="font-medium">{createdOrganization.contactInfo ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Invoice Info:</span>
              <span className="font-medium">{createdOrganization.invoiceInfo ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Seats:</span>
              <span className="font-medium">{createdOrganization.maxSeats}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Created At:</span>
              <span className="font-medium">
                {new Date(createdOrganization.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
          <Button
            onClick={() => {
              setCreatedOrganization(null);
              form.reset();
              setOpen(false);
            }}
            className="mt-4"
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col border-b pb-4 border-white/5 p-4">
        <h2 className="text-lg font-bold">Organization Details</h2>
        <p className="text-sm text-muted-foreground">
          Add a new organization to the system
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 p-4 bg-muted"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Organization Name"
                    className="bg-primary-foreground"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactInfo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Information</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Contact details"
                    className="bg-primary-foreground min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="invoiceInfo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Information</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Invoice details"
                    className="bg-primary-foreground min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxSeats"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Seats</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    className="bg-primary-foreground"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 w-full items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              className="cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Organization"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
