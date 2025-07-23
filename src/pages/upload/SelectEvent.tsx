import { Button } from "@/components/ui/button";
import { FileUp } from "lucide-react";
import Layout from "./layout";
import { events } from "./mock";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useNavigate, useSearchParams } from "react-router-dom";
import Combobox from "@/components/ui/combo-box";

const FormSchema = z.object({
  event: z.string({
    required_error: "Please select an event.",
  }),
});

export default function SelectEventPage() {
  const [searchParams] = useSearchParams();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      event: searchParams.get("event") || undefined,
    },
  });
  const navigate = useNavigate();

  function onSubmit(data: z.infer<typeof FormSchema>) {
    navigate(`/upload/trailandturn?event=${data.event}`);
  }
  return (
    <Layout description="First, select an event below">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="event"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Event</FormLabel>
                <Combobox
                  data={events}
                  value={field.value}
                  onSelect={(val) => form.setValue("event", val)}
                  itemLabel="event"
                />
                <FormDescription>
                  Don't see an event you're looking for? Tell an admin to create
                  one.
                </FormDescription>
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full">
            Next
          </Button>
          <Button
            type="button"
            size="lg"
            className="w-full"
            variant="secondary"
            onClick={() => navigate("/")}
          >
            Back
          </Button>
        </form>
      </Form>
    </Layout>
  );
}
