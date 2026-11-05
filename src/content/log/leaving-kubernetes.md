---
title: Leaving Kubernetes behind
summary: I took the cluster down and moved the homelab to NixOS. The migration was the easy part.
date: 2026-11-01
tags: [infrastructure, nixos, kubernetes]
---

I ran a Kubernetes cluster in my homelab for about a year. It worked. I archived it anyway.

The cluster was one node. I was running a control plane, etcd, a CNI, and ingress to schedule work that one host could run directly. Every upgrade was an event. Every debugging session started with "is this my app or the layer between me and my app?"

What I wanted was declared state: the machine's config lives in a file and the machine converges on it. NixOS gives me that per host, with rollbacks that work at boot and a build step that fails before deployment.

Kubernetes is fine. The cost of an abstraction has to be paid against a problem that's actually there, and "I might scale someday" isn't one.

The useful part was noticing when I'd added a layer for reasons that were about the layer.
