interface SpeechRecognitionEvent extends Event {
	readonly resultIndex: number;
	readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
	readonly length: number;
	item(index: number): SpeechRecognitionResult;
	[index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
	readonly isFinal: boolean;
	readonly length: number;
	item(index: number): SpeechRecognitionAlternative;
	[index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
	readonly transcript: string;
	readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
	readonly error: string;
	readonly message?: string;
}

interface SpeechRecognition extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
	onresult:
		| ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
		| null;
	onerror:
		| ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
		| null;
	onend: ((this: SpeechRecognition, ev: Event) => void) | null;
	start(): void;
	stop(): void;
	abort(): void;
}

interface SpeechRecognitionConstructor {
	new (): SpeechRecognition;
}

interface Window {
	SpeechRecognition?: SpeechRecognitionConstructor;
	webkitSpeechRecognition?: SpeechRecognitionConstructor;
}
