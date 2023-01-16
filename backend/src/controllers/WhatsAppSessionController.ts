import { Request, Response } from "express";
import { deleteSession, getWbot, removeWbot } from "../libs/wbot";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
// import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";
import { getIO } from "../libs/socket";
import ResetWhatsappSession from "../services/WhatsappService/ResetWhatsappSession";

const store = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const whatsapp = await ShowWhatsAppService(whatsappId);

  StartWhatsAppSession(whatsapp);

  return res.status(200).json({ message: "Starting session." });
};

const update = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { isQrcode } = req.body;

  if (isQrcode) {
    await deleteSession(whatsappId);
  }
  await deleteSession(whatsappId);

  const { whatsapp } = await ResetWhatsappSession(whatsappId);

  StartWhatsAppSession(whatsapp);

  return res.status(200).json({ message: "Starting session." });
};

const remove = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const whatsapp = await ShowWhatsAppService(whatsappId);
  const wbot = getWbot(whatsapp.id);

  // await wbot.logout() -> Method with bugs, does not provides a stable disconnection
  await wbot.destroy();
  removeWbot(whatsapp.id);

  const io = getIO();
  await whatsapp.update({
    status: "DISCONNECTED",
    session: "",
    qrcode: null,
    retries: 0
  });

  io.emit("whatsappSession", {
    action: "update",
    session: whatsapp
  });

  return res.status(200).json({ message: "Session disconnected." });
};

export default { store, remove, update };
