package service

import (
	"golang.org/x/net/context"

	"github.com/keybase/client/go/protocol/chat1"
	"github.com/keybase/go-framed-msgpack-rpc/rpc"
)

type RemoteChatUI struct {
	sessionID int
	cli       chat1.ChatUiClient
}

func NewRemoteChatUI(sessionID int, c *rpc.Client) *RemoteChatUI {
	return &RemoteChatUI{
		sessionID: sessionID,
		cli:       chat1.ChatUiClient{Cli: c},
	}
}

func (r *RemoteChatUI) ChatAttachmentUploadStart(ctx context.Context) error {
	return r.cli.ChatAttachmentUploadStart(ctx, r.sessionID)
}

func (r *RemoteChatUI) ChatAttachmentUploadProgress(ctx context.Context, arg chat1.ChatAttachmentUploadProgressArg) error {
	arg.SessionID = r.sessionID
	return r.cli.ChatAttachmentUploadProgress(ctx, arg)
}

func (r *RemoteChatUI) ChatAttachmentUploadDone(ctx context.Context) error {
	return r.cli.ChatAttachmentUploadDone(ctx, r.sessionID)
}

func (r *RemoteChatUI) ChatAttachmentPreviewUploadStart(ctx context.Context) error {
	return r.cli.ChatAttachmentPreviewUploadStart(ctx, r.sessionID)
}

func (r *RemoteChatUI) ChatAttachmentPreviewUploadDone(ctx context.Context) error {
	return r.cli.ChatAttachmentPreviewUploadDone(ctx, r.sessionID)
}

func (r *RemoteChatUI) ChatAttachmentDownloadStart(ctx context.Context) error {
	return r.cli.ChatAttachmentDownloadStart(ctx, r.sessionID)
}

func (r *RemoteChatUI) ChatAttachmentDownloadProgress(ctx context.Context, arg chat1.ChatAttachmentDownloadProgressArg) error {
	arg.SessionID = r.sessionID
	return r.cli.ChatAttachmentDownloadProgress(ctx, arg)
}

func (r *RemoteChatUI) ChatAttachmentDownloadDone(ctx context.Context) error {
	return r.cli.ChatAttachmentDownloadDone(ctx, r.sessionID)
}

func (r *RemoteChatUI) ChatInboxConversation(ctx context.Context, arg chat1.ChatInboxConversationArg) error {
	return r.cli.ChatInboxConversation(ctx, arg)
}

func (r *RemoteChatUI) ChatInboxFailed(ctx context.Context, arg chat1.ChatInboxFailedArg) error {
	return r.cli.ChatInboxFailed(ctx, arg)
}

func (r *RemoteChatUI) ChatInboxUnverified(ctx context.Context, arg chat1.ChatInboxUnverifiedArg) error {
	return r.cli.ChatInboxUnverified(ctx, arg)
}
