"use client";

// "use client"
// → 이 파일은 브라우저에서 실행되는 React 컴포넌트라는 Next.js 문법입니다.
// → 입력값, 클릭, localStorage를 사용하므로 필요합니다.

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  // useState
  // → 화면의 입력값처럼 계속 바뀌는 값을 관리하는 React 기능입니다.
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // useRouter
  // → 코드로 페이지를 이동할 때 사용하는 Next.js 기능입니다.
  const router = useRouter();

  // 로그인 폼을 제출했을 때 실행되는 함수입니다.
  async function handleLogin(event) {
    // form 제출 시 페이지가 새로고침되는 기본 동작을 막습니다.
    event.preventDefault();

    setMessage("로그인 중입니다...");

    try {
      // fetch
      // → 프론트엔드에서 백엔드 API에 요청을 보내는 브라우저 기본 기능입니다.
      const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },

            // JSON.stringify()
            // → 자바스크립트 객체를 서버가 이해하는 JSON 문자열로 바꿉니다.
            body: JSON.stringify({
              userId: userId,
              password: password,
            }),
          }
      );

      // 백엔드가 보낸 JSON 응답을 자바스크립트 객체로 변환합니다.
      const data = await response.json();

      // 로그인 실패: 예) 아이디 또는 비밀번호 불일치
      if (!response.ok) {
        setMessage(data.message || "로그인에 실패했습니다.");
        return;
      }

      // 로그인 성공 시 백엔드가 보낸 JWT를 브라우저에 저장합니다.
      localStorage.setItem("token", data.token);

      setMessage("로그인에 성공했습니다.");

      // 선택 계획 목록 페이지로 이동합니다.
      router.push("/plans");
    } catch (error) {
      // 서버가 꺼져 있거나 주소가 잘못되었을 때 실행됩니다.
      setMessage("서버와 연결할 수 없습니다.");
    }
  }

  return (
      <main>
        <h1>모빌리티 초이스</h1>
        <p>나의 생활패턴에 맞는 모빌리티 선택 계획을 관리하세요.</p>

        <form onSubmit={handleLogin}>
          <div>
            <label htmlFor="userId">아이디</label>
            <br />
            <input
                id="userId"
                type="text"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                placeholder="아이디를 입력하세요"
                required
            />
          </div>

          <br />

          <div>
            <label htmlFor="password">비밀번호</label>
            <br />
            <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
            />
          </div>

          <br />

          <button type="submit">로그인</button>
        </form>
          <p>
              계정이 없으신가요? <Link href="/register">회원가입</Link>
          </p>

        <p>{message}</p>
      </main>
  );
}