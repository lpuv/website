---
title: infra-k8s
designation: Infrastructure
summary: A single-node Kubernetes cluster I ran, and then didn't.
role: Solo
period: "2025"
status: archived
stack: [Kubernetes, Shell, Docker]
repo: https://github.com/lpuv/infra-k8s
order: 40
featured: false
---

## What it was

A Kubernetes-managed homelab. Workloads declared, scheduled, and reconciled by the cluster instead of by me SSHing into boxes.

## Why it's archived

I was running a control plane to schedule work one machine could run. The control plane, etcd, the CNI, and ingress were more work than the things they ran. Every upgrade was an event.

Moving to NixOS in [`nix-lab`](/systems/nix-lab) was the same goal with the abstraction level matched to the problem.

## What I kept

The desired-state model. Declaring what a machine should look like and letting it converge is the right instinct at any scale. Kubernetes just isn't the only way to get it, and for a homelab it usually isn't the cheapest.

The useful part was learning when not to use a tool.
