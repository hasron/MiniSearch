import {
  useEffect,
  useRef,
  FormEvent,
  useState,
  useCallback,
  ChangeEvent,
  KeyboardEvent,
  ReactNode,
} from "react";
import { getRandomQuerySuggestion } from "../../../modules/querySuggestions";
import { useLocation } from "wouter";
import { prepareTextGeneration } from "../../../modules/textGeneration";
import { match, Pattern } from "ts-pattern";
import { Button, Group, Stack, Textarea } from "@mantine/core";
import { addLogEntry } from "../../../modules/logEntries";
import { sleepUntilIdle } from "../../../modules/sleep";
import { settingsPubSub } from "../../../modules/pubSub";
import { usePubSub } from "create-pubsub/react";
import { postMessageToParentWindow } from "../../../modules/parentWindow";

export function SearchForm({
  query,
  updateQuery,
  additionalButtons,
}: {
  query: string;
  updateQuery: (query: string) => void;
  additionalButtons?: ReactNode;
}) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [textAreaValue, setTextAreaValue] = useState(query);
  const windowInnerHeight = useWindowInnerHeight();
  const defaultSuggestedQuery = "Anything you need!";
  const [suggestedQuery, setSuggestedQuery] = useState(defaultSuggestedQuery);
  const [, navigate] = useLocation();
  const [settings] = usePubSub(settingsPubSub);

  useEffect(() => {
    sleepUntilIdle().then(() => {
      prepareTextGeneration();
    });
  }, []);

  useEffect(() => {
    getRandomQuerySuggestion().then((querySuggestion) => {
      setSuggestedQuery(querySuggestion);
    });
  }, []);

  const handleInputChange = async (event: ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;

    setTextAreaValue(text);

    if (text.length === 0) {
      setSuggestedQuery(await getRandomQuerySuggestion());
    }
  };

  const handleClearButtonClick = async () => {
    setSuggestedQuery(await getRandomQuerySuggestion());
    setTextAreaValue("");
    textAreaRef.current?.focus();
    addLogEntry("User cleaned the search query field");
  };

  const startSearching = useCallback(() => {
    const queryToEncode = match(textAreaValue.trim())
      .with(Pattern.string.minLength(1), () => textAreaValue)
      .otherwise(() => suggestedQuery);

    setTextAreaValue(queryToEncode);

    const queryString = `q=${encodeURIComponent(queryToEncode)}`;

    postMessageToParentWindow({ queryString, hash: "" });

    navigate(`/?${queryString}`, { replace: true });

    updateQuery(queryToEncode);

    prepareTextGeneration();

    addLogEntry(
      `User submitted a search with ${queryToEncode.length} characters length`,
    );
  }, [textAreaValue, suggestedQuery, updateQuery]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startSearching();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    match([event, settings.enterToSubmit])
      .with([{ code: "Enter", shiftKey: false }, true], () => {
        event.preventDefault();
        startSearching();
      })
      .with([{ code: "Enter", shiftKey: true }, false], () => {
        event.preventDefault();
        startSearching();
      })
      .otherwise(() => undefined);
  };

  return (
    <div
      style={match(query)
        .with(Pattern.string.length(0), () => ({
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: windowInnerHeight * 0.8,
        }))
        .otherwise(() => undefined)}
    >
      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
        <Stack gap="xs">
          <Textarea
            value={textAreaValue}
            placeholder={suggestedQuery}
            ref={textAreaRef}
            onKeyDown={handleKeyDown}
            onChange={handleInputChange}
            autosize
            minRows={1}
            maxRows={8}
            autoFocus
          />
          <Group gap="xs">
            {match(textAreaValue)
              .with(Pattern.string.minLength(1), () => (
                <Button
                  size="xs"
                  onClick={handleClearButtonClick}
                  variant="default"
                >
                  Clear
                </Button>
              ))
              .otherwise(() => null)}
            <Button size="xs" type="submit" variant="default" flex={1}>
              Search
            </Button>
            {additionalButtons}
          </Group>
        </Stack>
      </form>
    </div>
  );
}

function useWindowInnerHeight() {
  const [windowInnerHeight, setWindowInnerHeight] = useState(self.innerHeight);

  useEffect(() => {
    const handleResize = () => setWindowInnerHeight(self.innerHeight);

    self.addEventListener("resize", handleResize);

    return () => self.removeEventListener("resize", handleResize);
  }, []);

  return windowInnerHeight;
}