class ToastStore {
	list = $state([]);

	add({ title, body, source, duration = 6000 }) {
		const id = crypto.randomUUID();
		this.list.push({ id, title, body, source, duration, createdAt: Date.now() });
		setTimeout(() => this.dismiss(id), duration);
	}

	dismiss(id) {
		const idx = this.list.findIndex((t) => t.id === id);
		if (idx !== -1) this.list.splice(idx, 1);
	}
}

export const toastStore = new ToastStore();
