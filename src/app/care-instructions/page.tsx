/**
 * File:     care-instructions/page.tsx
 * Purpose:  Displays all of the care instructions.
 * Authors:  Ojos Project & Iris contributors
 * License:  GNU General Public License v3.0
 */
"use client";
import { CareInstruction } from "@/types/care-instructions";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import CareInstructionsButton from "./_components/CareInstructionButton";
import useKeyPress from "@/components/useKeyPress";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import Link from "next/link";

export default function CareInstructions() {
  const [instructions, setInstructions] = useState<CareInstruction[]>([]);
  const router = useRouter();

  useKeyPress("Escape", () => {
    router.push("/");
  });

  useEffect(() => {
    invoke<CareInstruction[]>("get_all_care_instructions").then((i) => {
      setInstructions(i);
    });
  }, []);

  return (
    <Layout
      title="Care Instructions"
      handleBackClick={() => {
        router.push("/");
      }}
    >
      <div className={styles.allInstructionsLayout}>
        {instructions.length === 0 ? (
          <p>There are no care instructions recorded.</p>
        ) : (
          instructions.map((instruction) => {
            return (
              <CareInstructionsButton
                key={instruction.id}
                instruction={instruction}
              />
            );
          })
        )}

        <div className={styles.backMenuContainer}>
          <div className={styles.buttonMenu}>
            <Link
              className="linkButton"
              href={{
                pathname: "./care-instructions/view/",
              }}
            >
              <button className="primary">Add Instructions</button>
            </Link>

            <Link className="linkButton" href="/resources">
              <button className="secondary">Resources</button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
