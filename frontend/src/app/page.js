"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
    const router = useRouter();

    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleLogin(event) {
        event.preventDefault();

        setIsSubmitting(true);
        setMessage("");

        try {
            const apiBaseUrl =
                process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

            const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(
                    data.message || "아이디 또는 비밀번호를 확인해주세요."
                );
                return;
            }

            localStorage.setItem("token", data.token);
            router.push("/vehicles");
        } catch {
            setMessage("서버와 연결할 수 없습니다.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className={styles.page}>
            <div className={styles.shell}>
                <section className={styles.brandSection}>
                    <Link href="/" className={styles.wordmark}>
                        MOBILITY CHOICE
                    </Link>

                    <div className={styles.hero}>
                        <p className={styles.eyebrow}>
                            PERSONAL MOBILITY SERVICE
                        </p>

                        <h1>당신의 일상에 맞춘 모빌리티</h1>

                        <p className={styles.heroDescription}>
                            차량부터 구매·리스·렌트까지, 당신의 일상에 맞춰 비교하세요.
                        </p>

                        <div className={styles.featureTags}>
                            <span>차량 탐색</span>
                            <span>이용 방식 비교</span>
                            <span>옵션 비교</span>
                        </div>
                    </div>

                    <div className={styles.carScene} aria-hidden="true">
                        <div className={styles.carGlow} />
                        <div className={styles.carBody}>
                            <span className={styles.carWindow} />
                            <span className={styles.carLight} />
                            <span className={styles.wheelLeft} />
                            <span className={styles.wheelRight} />
                        </div>
                    </div>

                    <p className={styles.brandFootnote}>
                        Make your next mobility choice with clarity.
                    </p>
                </section>

                <section className={styles.loginSection}>
                    <div className={styles.loginContent}>
                        <p className={styles.mobileWordmark}>MOBILITY CHOICE</p>

                        <div className={styles.loginHeading}>
                            <p>WELCOME BACK</p>
                            <h2>로그인</h2>
                            <span>
                                조건을 선택하고, 나에게 맞는 차량을 비교해보세요.
                            </span>
                        </div>

                        <form className={styles.form} onSubmit={handleLogin}>
                            <div className={styles.field}>
                                <label htmlFor="userId">아이디</label>
                                <input
                                    id="userId"
                                    type="text"
                                    value={userId}
                                    onChange={(event) =>
                                        setUserId(event.target.value)
                                    }
                                    placeholder="아이디를 입력하세요"
                                    autoComplete="username"
                                    required
                                />
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="password">비밀번호</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    placeholder="비밀번호를 입력하세요"
                                    autoComplete="current-password"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={styles.loginButton}
                            >
                                <span>
                                    {isSubmitting ? "로그인 중..." : "로그인"}
                                </span>
                                <strong aria-hidden="true">→</strong>
                            </button>
                        </form>

                        <p className={styles.message} aria-live="polite">
                            {message}
                        </p>

                        <p className={styles.signupGuide}>
                            아직 계정이 없으신가요?{" "}
                            <Link href="/register">회원가입</Link>
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}