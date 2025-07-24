import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import Layout from "./layout";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo } from "react";
import Combobox from "@/components/ui/combo-box";
import { Button } from "@/components/ui/button";
import { useRoutes, useTurns } from "@/services/api";

const FormSchema = z.object({
  route: z.string({
    required_error: "Please select a route.",
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
    defaultValues: {
      route: searchParams.get("route") || undefined,
      turn: searchParams.get("turn") || undefined,
    },
  });

  const { routes } = useRoutes(searchParams.get("event") || undefined);
  const routesData = useMemo(
    () =>
      routes.data
        ? routes.data.map((route) => ({
            label: route.route_name,
            value: route.id,
          }))
        : [],
    [routes.data],
  );

  //
  // const { turns } = useTurns();
  // const turnsData = useMemo(
  //   () =>
  //     turns.data
  //       ? turns.data.map((turn) => ({
  //           label: turn.route_name,
  //           value: turn.id,
  //         }))
  //       : [],
  //   [turns.data],
  // );

  function onSubmit(data: z.infer<typeof FormSchema>) {
    navigate(
      `/upload/video?event=${searchParams.get("event")}&route=${data.route}&turn=${data.turn}`,
    );
  }
  return (
    <Layout description="Next, select a route and turn below">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="route"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Route</FormLabel>
                <Combobox
                  data={routesData}
                  value={field.value}
                  onSelect={(val) => form.setValue("route", val as string)}
                  itemLabel="route"
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
                  data={[]}
                  value={field.value}
                  onSelect={(val) => form.setValue("turn", val as string)}
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
            onClick={() => navigate(`/upload/event?${searchParams.toString()}`)}
          >
            Back
          </Button>
        </form>
      </Form>
    </Layout>
  );
}
