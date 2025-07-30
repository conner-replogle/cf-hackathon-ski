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
import { FilePond } from "react-filepond";
import "filepond/dist/filepond.min.css";
import Combobox from "@/components/ui/combo-box";
import {
  useAthletes,
  useCreateRun,
  useRuns,
  useRoute,
  useTurn,
  useTurns,
} from "@/services/api";
import { Check, ChevronsUpDown, Plus, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import * as tus from "tus-js-client";

const FormSchema = z.object({
  video: z.instanceof(File, { message: "Please upload a video" }),
  athlete: z.number({
    required_error: "Please select an athlete.",
  }),
  run: z.number({
    required_error: "Please select a run.",
  }),
});

export default function SelectVideoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [showSuccessMsg, setShowSuccessMsg] = useState(false);
  const turnId = parseInt(searchParams?.get("turn") || "");
  const routeId = parseInt(searchParams?.get("route") || "");
  const { mutateAsync: createRun } = useCreateRun();

  // Fetch route and turn data for display
  const { data: route } = useRoute(routeId);
  const { data: turn } = useTurn(turnId);
  const { data: routeTurns } = useTurns(routeId);

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

  const { data: athletes } = useAthletes();
  const athletesData = useMemo(
    () =>
      athletes
        ? athletes.map((athlete) => ({
            label: athlete.athleteName,
            value: athlete.id,
          }))
        : [],
    [athletes],
  );

  const selectedAthleteId = form.watch("athlete");
  const { data: runs } = useRuns(routeId, selectedAthleteId);

  const runsData = useMemo(
    () =>
      runs
        ? runs.map((run) => ({
            label: "Run " + run.runOrder,
            value: run.id,
            active: run.clips.find((a) => a.turnId == turnId) == null,
          }))
        : [],
    [runs, turnId],
  );

  const handleCreateRunClicked = async () => {
    const runId = await createRun({
      routeId: parseInt(searchParams?.get("route") || ""),
      athleteId: selectedAthleteId,
      runOrder: -1,
    });

    form.setValue("run", runId.id);
    setComboboxOpen(false);
  };

  const [comboboxOpen, setComboboxOpen] = useState(false);

  const selectedRunId = form.watch("run");

  const selectedRun = runs?.find((run) => run.id == selectedRunId);

  return (
    <Layout description="Finally upload a video and tag an athlete">
      <Form {...form}>
        {/* Current Route and Turn Display */}
        {(route || turn) && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Current Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {route && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-1">
                      Route
                    </h4>
                    <p className="text-lg font-semibold">{route.routeName}</p>
                  </div>
                )}
                {turn && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-1">
                      Turn
                    </h4>
                    <p className="text-lg font-semibold">{turn.turnName}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Duplicate Upload Warning */}
        {/* { && selectedRunId && (
          <Alert className="mb-4 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Warning:</strong> This turn already has a clip uploaded for the selected run. 
              Uploading a new video will replace the existing clip.
            </AlertDescription>
          </Alert>
        )} */}

        {/* Clips Status Display */}

        <form className="space-y-4">
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
          <FormField
            control={form.control}
            name="run"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Run</FormLabel>
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        size="lg"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value
                          ? runsData.find((item) => item.value === field.value)
                              ?.label
                          : "Select runs"}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                    <Command>
                      <CommandInput
                        placeholder={`Search runs...`}
                        className="h-12"
                      />
                      <CommandList>
                        <div className="px-1 py-2">
                          <Button
                            className="w-full"
                            onClick={handleCreateRunClicked}
                          >
                            <Plus />
                            Create new run instead
                          </Button>
                        </div>
                        <hr className="mb-2" />
                        <CommandEmpty>No runs found.</CommandEmpty>
                        <CommandGroup>
                          {runsData.map((item) => (
                            <CommandItem
                              disabled={!item.active}
                              value={item.value.toString()}
                              key={item.label}
                              onSelect={(val) => {
                                console.log(val);
                                form.setValue("run", parseInt(val));
                                setComboboxOpen(false);
                              }}
                            >
                              {item.label}{" "}
                              {!item.active && <Upload color="green" />}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  item.value === field.value
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />
          {selectedRun && routeTurns && routeTurns.map && (
            <div className="flex flex-row justify-center gap-2">
              {routeTurns?.map((turn) => {
                const done = selectedRun.clips.find((a) => a.turnId == turn.id);

                return (
                  <div
                    style={{
                      border: turnId == turn.id ? "solid" : "none",
                      backgroundColor: done ? "lightgreen" : "",
                    }}
                    className="flex flex-col border-2 border-green-300 items-center gap-4 justify-center rounded-4xl bg-accent p-2"
                  >
                    <p>{turn.turnName}</p>
                    {done ? <Check /> : <Upload />}
                  </div>
                );
              })}
            </div>
          )}
          <FormField
            control={form.control}
            name="video"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video</FormLabel>
                <FilePond
                  files={field.value ? [field.value] : []}
                  onupdatefiles={(fileItems) => {
                    form.setValue("video", fileItems[0]?.file as File);
                  }}
                  allowMultiple={false}
                  server={{
                    process: (_fieldName, file, _metadata, load, error, progress, abort) => {
                      const upload = new tus.Upload(file, {
                        endpoint: `/api/runs/${selectedRunId}/clips/${turnId}/upload`,
                        retryDelays: [0, 3000, 5000, 10000, 20000],
                        metadata: {
                          filename: file.name,
                          filetype: file.type,
                        },
                        onError: (err) => {
                          console.error("Failed because: " + err);
                          error("Upload failed");
                        },
                        onProgress: (bytesUploaded, bytesTotal) => {
                          progress(true, bytesUploaded, bytesTotal);
                        },
                        onSuccess: () => {
                            console.log("Download %s from %s", (upload.file as File).name, upload.url);
                            load(upload.url as string);
                            setShowSuccessMsg(true);
                            form.reset();
                          },
                      });

                      upload.start();

                      return {
                        abort: () => {
                          upload.abort();
                          abort();
                        },
                      };
                    },
                  }}
                  name="video"
                  labelIdle='Drag & Drop your video or <span class="filepond--label-action">Browse</span>'
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="lg"
              className="flex-1"
              variant="outline"
              onClick={() => window.history.back()}
            >
              Back
            </Button>
            <Button
              type="button"
              size="lg"
              className="flex-1"
              variant="outline"
              onClick={() => {
                form.reset();
                setShowSuccessMsg(false);
              }}
            >
              Clear Form
            </Button>
            
          </div>
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
