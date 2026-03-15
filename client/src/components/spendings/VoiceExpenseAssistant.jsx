import { useEffect, useRef, useState } from "react";
import { FaMicrophone, FaStop } from "react-icons/fa";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { spendingsApi } from "../../api/modules/spendings";
import toasts from "../../utils/toasts";
import { spendingStyles } from "./styles";

const getSpeechRecognitionConstructor = () => {
  if (typeof window === "undefined") return null;

  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const getSpeechRecognitionEventConstructor = () => {
  if (typeof window === "undefined") return null;

  return (
    window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent || null
  );
};

const getRecognitionErrorMessage = (error) => {
  switch (error) {
    case "aborted":
      return null;
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission is blocked for this tab.";
    case "no-speech":
      return "No speech was detected. Please try again.";
    case "audio-capture":
      return "No microphone was found on this device.";
    case "network":
      return "Speech recognition could not reach the browser service. Please try Chrome on localhost and check your internet connection.";
    case "language-not-supported":
      return "This browser does not support English voice recognition for this device.";
    default:
      return `Voice capture failed (${error}). Please try again.`;
  }
};

const formatFieldValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not detected";
  }

  return value;
};

const VoiceExpenseAssistant = ({ onApply }) => {
  const recognitionRef = useRef(null);
  const isStartingRef = useRef(false);
  const manualStopRef = useRef(false);
  const isSpeechSupported = Boolean(
    getSpeechRecognitionConstructor() && getSpeechRecognitionEventConstructor()
  );

  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsedExpense, setParsedExpense] = useState(null);

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    const SpeechRecognitionEvent = getSpeechRecognitionEventConstructor();

    if (!SpeechRecognition || !SpeechRecognitionEvent) return undefined;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      isStartingRef.current = false;
      manualStopRef.current = false;
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const spokenText = event.results?.[0]?.[0]?.transcript?.trim() || "";

      if (!spokenText) {
        return;
      }

      setTranscript(spokenText);
      setParsedExpense(null);
    };

    recognition.onspeechend = () => {
      if (!manualStopRef.current) {
        recognition.stop();
      }
    };

    recognition.onnomatch = () => {
      toast.warn(
        "Speech was captured but could not be recognized. Please try again.",
        toasts.warning
      );
    };

    recognition.onerror = (event) => {
      isStartingRef.current = false;
      setIsListening(false);

      if (event.error === "aborted" && manualStopRef.current) {
        manualStopRef.current = false;
        return;
      }

      const message = getRecognitionErrorMessage(event.error);

      if (message) {
        toast.error(message);
      }
    };

    recognition.onend = () => {
      isStartingRef.current = false;
      manualStopRef.current = false;
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      manualStopRef.current = true;
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onspeechend = null;
      recognition.onnomatch = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort?.();
      recognitionRef.current = null;
    };
  }, []);

  const handleStartListening = () => {
    if (!recognitionRef.current) {
      toast.warn(
        "Voice input is not supported in this browser. You can still paste a transcript below.",
        toasts.warning
      );
      return;
    }

    if (isListening || isStartingRef.current) {
      return;
    }

    try {
      manualStopRef.current = false;
      isStartingRef.current = true;
      recognitionRef.current.start();
    } catch (error) {
      isStartingRef.current = false;
      toast.error(
        error?.name === "InvalidStateError"
          ? "Voice capture is still closing from the previous attempt. Please wait a moment and try again."
          : "Voice capture could not start. Please try again."
      );
    }
  };

  const handleStopListening = () => {
    manualStopRef.current = true;
    recognitionRef.current?.stop?.();
  };

  const handleParseTranscript = async () => {
    if (!transcript.trim()) {
      toast.warn(
        "Record or type a transcript before extracting expense details.",
        toasts.warning
      );
      return;
    }

    try {
      setIsParsing(true);
      const result = await spendingsApi.parseVoiceExpense({
        text: transcript.trim(),
        language: "en-IN",
      });

      setParsedExpense(result.data);
    } catch (error) {
      toast.error(error.message || "Unable to parse the transcript right now.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleApply = () => {
    if (!parsedExpense) return;

    onApply(parsedExpense);
    toast.success("Voice details added to the form.");
  };

  return (
    <div className={spendingStyles.voiceAssistant.container}>
      <div className={spendingStyles.voiceAssistant.header}>
        <div>
          <p className={spendingStyles.voiceAssistant.title}>Add by voice</p>
          <p className={spendingStyles.voiceAssistant.subtitle}>
            Say something like &quot;500 rupees paid by me for lunch&quot;
          </p>
        </div>
        <button
          type="button"
          className={spendingStyles.voiceAssistant.micButton(
            isListening,
            isSpeechSupported
          )}
          onClick={isListening ? handleStopListening : handleStartListening}
        >
          {isListening ? <FaStop /> : <FaMicrophone />}
        </button>
      </div>

      {!isSpeechSupported && (
        <p className={spendingStyles.voiceAssistant.helper}>
          Voice capture is not available in this browser, but you can paste or type the transcript here.
        </p>
      )}

      <textarea
        rows="4"
        value={transcript}
        onChange={(event) => {
          setTranscript(event.target.value);
          setParsedExpense(null);
        }}
        className={spendingStyles.voiceAssistant.transcript}
        placeholder="Your spoken sentence will appear here for confirmation."
      />

      <div className={spendingStyles.voiceAssistant.actions}>
        <button
          type="button"
          className={spendingStyles.voiceAssistant.secondaryAction}
          onClick={() => {
            setTranscript("");
            setParsedExpense(null);
          }}
        >
          Clear
        </button>
        <button
          type="button"
          className={spendingStyles.voiceAssistant.primaryAction}
          onClick={handleParseTranscript}
          disabled={isParsing}
        >
          {isParsing ? "Extracting..." : "Extract details"}
        </button>
      </div>

      {parsedExpense && (
        <div className={spendingStyles.voiceAssistant.resultCard}>
          <div className={spendingStyles.voiceAssistant.resultGrid}>
            <div>
              <p className={spendingStyles.voiceAssistant.resultLabel}>Amount</p>
              <p className={spendingStyles.voiceAssistant.resultValue}>
                {formatFieldValue(parsedExpense.amount)}
              </p>
            </div>
            <div>
              <p className={spendingStyles.voiceAssistant.resultLabel}>Currency</p>
              <p className={spendingStyles.voiceAssistant.resultValue}>
                {formatFieldValue(parsedExpense.currency)}
              </p>
            </div>
            <div>
              <p className={spendingStyles.voiceAssistant.resultLabel}>Description</p>
              <p className={spendingStyles.voiceAssistant.resultValue}>
                {formatFieldValue(parsedExpense.description)}
              </p>
            </div>
            <div>
              <p className={spendingStyles.voiceAssistant.resultLabel}>Payer</p>
              <p className={spendingStyles.voiceAssistant.resultValue}>
                {formatFieldValue(parsedExpense.payer)}
              </p>
            </div>
            <div>
              <p className={spendingStyles.voiceAssistant.resultLabel}>Date</p>
              <p className={spendingStyles.voiceAssistant.resultValue}>
                {formatFieldValue(parsedExpense.date)}
              </p>
            </div>
          </div>

          {parsedExpense.missingFields?.length > 0 && (
            <div className={spendingStyles.voiceAssistant.chips}>
              {parsedExpense.missingFields.map((field) => (
                <span className={spendingStyles.voiceAssistant.chip} key={field}>
                  Missing {field}
                </span>
              ))}
            </div>
          )}

          {parsedExpense.notes?.length > 0 && (
            <div className={spendingStyles.voiceAssistant.notes}>
              {parsedExpense.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          )}

          <button
            type="button"
            className={`${spendingStyles.voiceAssistant.primaryAction} mt-4`}
            onClick={handleApply}
          >
            Apply to form
          </button>
        </div>
      )}
    </div>
  );
};

VoiceExpenseAssistant.propTypes = {
  onApply: PropTypes.func.isRequired,
};

export default VoiceExpenseAssistant;
