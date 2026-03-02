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
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import type { Organization, UpdateOrganizationRequest } from "@/lib/api";

const editOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactInfo: z.string().optional(),
  invoiceInfo: z.string().optional(),
  maxSeats: z.number().int().min(1, "Must have at least 1 seat"),
  isActive: z.boolean(),
});

type EditOrganizationFormValues = z.infer<typeof editOrganizationSchema>;

interface EditOrganizationFormProps {
  organization: Organization;
  setOpen: (open: boolean) => void;
  onUpdate: (id: string, req: UpdateOrganizationRequest) => Promise<{ data?: Organization; error?: string }>;
}

export function EditOrganizationForm({
  organization,
  setOpen,
  onUpdate,
}: Readonly<EditOrganizationFormProps>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatedOrganization, setUpdatedOrganization] = useState<Organization | null>(null);

  const form = useForm<EditOrganizationFormValues>({
    resolver: zodResolver(editOrganizationSchema),
    defaultValues: {
      name: organization.name,
      contactInfo: organization.contactInfo ?? "",
      invoiceInfo: organization.invoiceInfo ?? "",
      maxSeats: organization.maxSeats,
      isActive: organization.isActive,
    },
  });

  const onSubmit = async (data: EditOrganizationFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await onUpdate(organization.id, {
        name: data.name,
        maxSeats: data.maxSeats,
        contactInfo: data.contactInfo || undefined,
        invoiceInfo: data.invoiceInfo || undefined,
        isActive: data.isActive,
      });
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        toast.success("Organization updated successfully");
        setUpdatedOrganization(result.data);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update organization"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (updatedOrganization) {
    return (
      <div className="flex flex-col">
        <div className="flex flex-col items-center justify-center p-8 gap-4">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
          <h2 className="text-xl font-bold">Organization Updated Successfully</h2>
          <div className="w-full space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{updatedOrganization.name}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Contact Info:</span>
              <span className="font-medium">{updatedOrganization.contactInfo ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Invoice Info:</span>
              <span className="font-medium">{updatedOrganization.invoiceInfo ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Seats:</span>
              <span className="font-medium">{updatedOrganization.maxSeats}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium">
                {updatedOrganization.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <Button
            onClick={() => {
              setUpdatedOrganization(null);
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
        <h2 className="text-lg font-bold">Edit Organization</h2>
        <p className="text-sm text-muted-foreground">
          Update organization details
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
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-3">
                  <FormControl>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={field.value}
                      onClick={() => field.onChange(!field.value)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        field.value ? "bg-primary" : "bg-input"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                          field.value ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </FormControl>
                  <Label className="cursor-pointer" onClick={() => field.onChange(!field.value)}>
                    {field.value ? "Active" : "Inactive"}
                  </Label>
                </div>
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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
