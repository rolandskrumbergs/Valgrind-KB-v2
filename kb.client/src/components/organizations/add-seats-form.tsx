import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const addSeatsSchema = z.object({
  seats: z.number().int().min(1, "Must add at least 1 seat"),
});

type AddSeatsFormValues = z.infer<typeof addSeatsSchema>;

interface AddSeatsFormProps {
  setOpen: (open: boolean) => void;
  onSubmit: (seats: number) => Promise<void>;
}

export function AddSeatsForm({
  setOpen,
  onSubmit,
}: Readonly<AddSeatsFormProps>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedSeats, setAddedSeats] = useState<number | null>(null);

  const form = useForm<AddSeatsFormValues>({
    resolver: zodResolver(addSeatsSchema),
    defaultValues: {
      seats: 1,
    },
  });

  const handleSubmit = async (data: AddSeatsFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data.seats);
      toast.success(`${data.seats} seat(s) added successfully`);
      setAddedSeats(data.seats);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add seats"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (addedSeats !== null) {
    return (
      <div className="flex flex-col">
        <div className="flex flex-col items-center justify-center p-8 gap-4">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
          <h2 className="text-xl font-bold">Seats Added Successfully</h2>
          <div className="w-full space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Seats Added:</span>
              <span className="font-medium">{addedSeats}</span>
            </div>
          </div>
          <Button
            onClick={() => {
              setAddedSeats(null);
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
        <h2 className="text-lg font-bold">Add Seats</h2>
        <p className="text-sm text-muted-foreground">
          Add new subscription seats to this organization
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4 p-4 bg-muted"
        >
          <FormField
            control={form.control}
            name="seats"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Seats</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
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
              {isSubmitting ? "Adding..." : "Add Seats"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
