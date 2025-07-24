import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Layout from "./layout";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import Combobox from "@/components/ui/combo-box";
// @ts-ignore
import FilePondPluginMediaPreview from "filepond-plugin-media-preview";
import "filepond-plugin-media-preview/dist/filepond-plugin-media-preview.min.css";
import { client, useAthletes } from "@/services/api";

registerPlugin(FilePondPluginMediaPreview);

const FormSchema = z.object({
  video: z.instanceof(File, { message: "Please upload a video" }),
  athlete: z.number({
    required_error: "Please select an athlete.",
  }),
});

export default function SelectVideoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [showSuccessMsg, setShowSuccessMsg] = useState(false);

  useEffect(() => {
    const params = ["event", "route", "turn"];
    for (const param of params) {
      if (!searchParams.get(param)) {
        navigate("/upload/event");
      }
    }
    // TOOD: validate eventId incase its stale
  }, [searchParams]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const { athletes } = useAthletes();
  const athletesData = useMemo(
    () =>
      athletes.data
        ? athletes.data.map((athlete) => ({
            label: athlete.athlete_name,
            value: athlete.id,
          }))
        : [],
    [athletes.data],
  );

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const run = await client.api.runs.$post({
      json: {
        route_id: parseInt(searchParams?.get("route") || ""),
        athlete_id: data.athlete,
      },
    });
    const runId = (await run.json()).id;

    await client.api.runs[":runId"].turns[":turnId"].clips.$post({
      param: {
        runId: runId.toString(),
        turnId: searchParams?.get("turn") || "",
      },
      form: { video: data.video },
    });
    setShowSuccessMsg(true);
    form.reset();
  }

  return (
    <Layout description="Finally upload a video and tag an athlete">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="video"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video</FormLabel>
                <FormControl>
                  <FilePond
                    files={field.value && [field.value]}
                    onupdatefiles={(files) => {
                      if (files) {
                        form.setValue("video", files[0].file as File);
                        form.clearErrors();
                      }
                    }}
                    allowMultiple={false}
                    name="files"
                    labelIdle='Drag & Drop videos or <span class="filepond--label-action">Click Here</span>'
                    credits={false}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="athlete"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Athlete</FormLabel>
                <Combobox
                  data={athletesData}
                  value={field.value}
                  onSelect={(val) => form.setValue("athlete", val as number)}
                  itemLabel="athlete"
                />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full">
            Upload
          </Button>
          <Button
            type="button"
            size="lg"
            className="w-full"
            variant="secondary"
            onClick={() =>
              navigate(`/upload/trailandturn?${searchParams.toString()}`)
            }
          >
            Back
          </Button>
        </form>
        {showSuccessMsg && (
          <div className="rounded-md ring ring-green-500 bg-green-500/10 text-green-700 p-2 text-center">
            Successfully uploaded!
          </div>
        )}
      </Form>
    </Layout>
  );
}
