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
