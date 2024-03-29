
module.exports = {
	*minimize(page, session=null) {
		if (!session) {
			session = yield page.target().createCDPSession();
		}
		const {windowId} = yield session.send('Browser.getWindowForTarget');
		yield session.send('Browser.setWindowBounds', {windowId, bounds: {windowState: 'minimized'}});
		return session;
	},
	*maximize(session) {
		const {windowId} = yield session.send('Browser.getWindowForTarget');
		yield session.send('Browser.setWindowBounds', {windowId, bounds: {windowState: 'normal'}});
		return session;
	},
}