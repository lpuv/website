---
title: "Orbital CubeSat C&DH"
designation: Embedded
summary: Firmware for the command and data handling system on McGill's Orbital CubeSat. FreeRTOS on a TMS570.
role: C&DH Lead
period: "Sep 2025 — present"
status: ongoing
stack: [C, FreeRTOS, TMS570, CMake]
order: 15
featured: true
---

## What it is

The C&DH division builds the command and data handling system for McGill's Orbital CubeSat (OCS). The flight MCU is a TMS570LS0714PZQ. We develop on a TMS570LS1224 dev board, which is close enough to bring up drivers and far enough that the board config has to be swappable.

I lead the division: architecture, the test plan, and the coordination between subsystems that all want to send data through the same computer.

## What's in the repo

FreeRTOS runs the scheduler. The repo has the HAL and board configs, a NOR flash driver, a diagnostic service, and tests that run on the board. The `dev` branch carries the TMS570LS1224 configs; the flight MCU config is meant to be a swap, not a rewrite.

The repository is private (McGill Rocket Team).

## What's hard

The spacecraft is not a server. The memory budget is fixed, the watchdog will reset you, and you can't debug it after launch. The test campaign has to prove the behavior before the hardware is gone.

The dev board is not the flight MCU. The pin muxing and peripheral set are different, so a driver that works on the desk can still be wrong on the flight target. We hit that with MIBSPI muxing.

## What I'd change

I'd bring the flight MCU config into CI earlier, so the dev-board assumptions fail on a desk instead of in integration.
