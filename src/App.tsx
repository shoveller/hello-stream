import { useEffect, useState } from "react";
import "./App.css";
import streamAPI from "./streamAPI";

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

function App() {
  const text = useStreamText(streamAPI);

  return (
    <div>
      <h1>스트리밍 텍스트</h1>
      <div>{text}</div>
    </div>
  );
}

export const Component = App;
export default App;
