# 엣지 런타임에서 동작하는 스트리밍 API 구현
- 엣지 런타임은 웹 표준 API만 사용할 수 있는 자바스크립트 서버이다.

# 스트리밍 API 구현
- 아래의 예제는 문자열을 50m 지연해서 스트리밍한다.
    - `ReadableStream` , `TextEncoder` 가 핵심이다.
    - 제네레이터를 사용하면 데이터를 생성하는 코드, sleep 코드, 스트리밍 api를 구분해서 추상화 할 수 있다.
    - 헤더 설정은 선택사항이다.
```ts
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));  
  
// 단어를 하나씩 생성하는 제네레이터 함수  
async function* generateWords() {  
    const text = "이 텍스트는 단어별로 스트리밍됩니다. 사용자는 각 단어가 하나씩 나타나는 것을 볼 수 있습니다.";  
    const words = text.split(" ");  
  
    for (const word of words) {  
        yield word + ' ';  
  
        // 단어 사이에 50ms 지연  
        await sleep(50)  
    }  
}
  
const streamAPI = async () => {  
    const encoder = new TextEncoder();  
  
    // 제네레이터를 ReadableStream으로 변환  
    const stream = new ReadableStream({  
        async start(controller) {  
            for await (const text of generateWords()) {
	            // 컨트롤러의 큐에 할당 
                controller.enqueue(encoder.encode(text));  
            }  
            controller.close();  
        }  
    });  
  
    return new Response(stream, {  
        // 헤더를 설정하지 않아도 동작한다.  
        headers: {  
            'Content-Type': 'text/plain; charset=utf-8',  
            'Transfer-Encoding': 'chunked'  
        }  
    })  
};  
  
export default streamAPI;
```

# 클라이언트 훅 구현
- 리스폰스 바디가 스트림이라는 것을 이용하면 `TextDecoder` 로 값을 읽을 수 있다.
    - `ReadableStreamDefaultReader` 가 `done` 신호를 보낼 때까지 반복한다.
    - `useState` 를 버퍼로 사용한다.
```ts
const useStreamText = (api: () => Promise<Response>) => {  
  const [text, setText] = useState("");  
  
  useEffect(() => {  
    let isMounted = true;  
  
    const fetchStream = async () => {  
      const response = await api();  
      const reader = response.body?.getReader();  
      const decoder = new TextDecoder("utf-8");  
  
      // 버퍼 초기화  
      setText("");  
  
      try {  
        while (reader && isMounted) {  
          const { done, value } = await reader.read();  
          if (done) break;  
  
          // 디코딩된 텍스트를 이전 상태에 추가  
          const chunk = decoder.decode(value, { stream: true });  
          setText((prevText) => prevText + chunk);  
        }  
      } catch (error) {  
        console.error("스트림 읽기 오류:", error);  
      } finally {  
        // 마지막 청크를 처리하기 위해 stream: false로 호출  
        if (reader && isMounted) {  
          setText(  
            (prevText) =>  
              prevText + decoder.decode(new Uint8Array(), { stream: false }),  
          );  
        }  
      }  
    };  
  
    fetchStream();  
  
    // 클린업 함수: 컴포넌트 언마운트 시 스트림 처리 중단  
    return () => {  
      isMounted = false;  
    };  
  }, [api]);  
  
  return text;  
};
```
