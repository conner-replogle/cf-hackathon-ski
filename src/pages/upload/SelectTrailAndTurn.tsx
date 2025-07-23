import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import Layout from "./layout";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import Combobox from "@/components/ui/combo-box";
import { trails, turns } from "./mock";
import { Button } from "@/components/ui/button";

const FormSchema = z.object({
  trail: z.string({
    required_error: "Please select a trail.",
  }),
  turn: z.string({
    required_error: "Please select a turn.",
  }),
});

export default function SelectTrailAndTurnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const eventId = searchParams.get("event");
    if (!eventId) {
      navigate("/upload/event");
    }
    // TOOD: validate eventId incase its stale
  }, [searchParams]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });
  function onSubmit(data: z.infer<typeof FormSchema>) {
    navigate(
      `/upload/video?event=${searchParams.get("event")}&trail=${data.trail}&turn=${data.turn}`,
    );
  }
  return (
    <Layout description="Next, select a trail and turn below">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="trail"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Trail</FormLabel>
                <Combobox
                  data={trails}
                  value={field.value}
                  onSelect={(val) => form.setValue("trail", val)}
                  itemLabel="trail"
                />
              </FormItem>
            )}
          />
          {/* TODO: change this to a different component */}
          <FormField
            control={form.control}
            name="turn"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Turn</FormLabel>
                <Combobox
                  data={turns}
                  value={field.value}
                  onSelect={(val) => form.setValue("turn", val)}
                  itemLabel="turn"
                />
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
            onClick={() => navigate("/upload/event")}
          >
            Back
          </Button>
        </form>
      </Form>
    </Layout>
  );
}
