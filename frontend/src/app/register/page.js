"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();

    // 회원가입 입력값을 각각 관리합니다.
    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    // 가입 요청 중인지 표시합니다.
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 성공·실패 안내 문구입니다.
    const [message, setMessage] = useState("");

    async function handleRegister(event) {
        // form 제출에 따른 브라우저 새로고침을 막습니다.
        event.preventDefault();

        // 프론트엔드에서 먼저 비밀번호 일치 여부를 확인합니다.
        if (password !== passwordConfirm) {
            setMessage("비밀번호가 서로 일치하지 않습니다.");
            return;
        }

        setIsSubmitting(true);
        setMessage("");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },

                    // 백엔드 회원가입 API가 받는 JSON 데이터입니다.
                    body: JSON.stringify({
                        userId: userId,
                        password: password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "회원가입에 실패했습니다.");
                return;
            }

            setMessage("회원가입이 완료되었습니다. 로그인 화면으로 이동합니다.");

            // 안내 문구를 잠시 보여준 뒤 로그인 화면으로 이동합니다.
            setTimeout(() => {
                router.push("/");
            }, 1000);
        } catch {
            setMessage("백엔드 서버와 연결할 수 없습니다.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main>
            <h1>회원가입</h1>
            <p>모빌리티 초이스 계정을 만들어 선택 계획을 관리하세요.</p>

            <form onSubmit={handleRegister}>
                <div>
                    <label htmlFor="userId">아이디</label>
                    <br />
                    <input
                        id="userId"
                        type="text"
                        value={userId}
                        onChange={(event) => setUserId(event.target.value)}
                        placeholder="사용할 아이디를 입력하세요"
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

                <div>
                    <label htmlFor="passwordConfirm">비밀번호 확인</label>
                    <br />
                    <input
                        id="passwordConfirm"
                        type="password"
                        value={passwordConfirm}
                        onChange={(event) => setPasswordConfirm(event.target.value)}
                        placeholder="비밀번호를 다시 입력하세요"
                        required
                    />
                </div>

                <br />

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "가입 처리 중..." : "회원가입"}
                </button>
            </form>

            {message && <p>{message}</p>}

            <p>
                이미 계정이 있으신가요? <Link href="/">로그인</Link>
            </p>
        </main>
    );
}