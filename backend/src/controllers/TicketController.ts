import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import CreateTicketService from "../services/TicketServices/CreateTicketService";
import DeleteTicketService from "../services/TicketServices/DeleteTicketService";
import ListTicketsService from "../services/TicketServices/ListTicketsService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import UpdateTicketService from "../services/TicketServices/UpdateTicketService";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import ShowQueueService from "../services/QueueService/ShowQueueService";
import formatBody from "../helpers/Mustache";
import ListTicketsServiceAdmin from "../services/TicketServices/ListTicketsServiceAdmin";

type IndexQuery = {
  adminFilterOptions: string;
  searchParam: string;
  pageNumber: string;
  status: string;
  date: string;
  showAll: string;
  withUnreadMessages: string;
  queueIds: string;
  selectedTags: string;
};

interface TicketData {
  contactId: number;
  status: string;
  queueId: number;
  userId: number;
  transf: boolean;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const {
    adminFilterOptions,
    pageNumber,
    status,
    date,
    searchParam,
    showAll,
    queueIds: queueIdsStringified,
    withUnreadMessages,
    selectedTags
  } = req.query as IndexQuery;

  const userId = req.user.id;

  const userProfile = req.user.profile;

  const adminFilter = adminFilterOptions ? JSON.parse(adminFilterOptions) : {};

  const notEmptyFilters: any = {};

  // eslint-disable-next-line array-callback-return
  Object.keys(adminFilter).map(key => {
    if (adminFilter[key].length > 0) {
      notEmptyFilters[key] = adminFilter[key];
    }
  });

  if (userProfile !== "admin" || Object.keys(notEmptyFilters).length === 0) {
    let queueIds: number[] = [];

    const tagSelect = selectedTags ? JSON.parse(selectedTags) : [];

    if (queueIdsStringified) {
      queueIds = JSON.parse(queueIdsStringified);
    }

    const { tickets, count, hasMore, allTicketsCount } =
      await ListTicketsService({
        searchParam,
        pageNumber,
        status,
        date,
        showAll,
        userId,
        queueIds,
        withUnreadMessages,
        tagSelect
      });

    return res.status(200).json({ tickets, count, hasMore, allTicketsCount });
  }
  const { tickets, count, hasMore, allTicketsCount } =
    await ListTicketsServiceAdmin({
      searchParam,
      pageNumber,
      status,
      date,
      showAll,
      userId,
      adminFilter: notEmptyFilters,
      withUnreadMessages
    });
  return res.status(200).json({ tickets, count, hasMore, allTicketsCount });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { contactId, status, userId, queueId }: TicketData = req.body;

  const ticket = await CreateTicketService({
    contactId,
    status,
    userId,
    queueId
  });

  const io = getIO();
  io.to(ticket.status).emit("ticket", {
    action: "update",
    ticket
  });

  return res.status(200).json(ticket);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;

  const contact = await ShowTicketService(ticketId);

  return res.status(200).json(contact);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const ticketData: TicketData = req.body;
  const { ticket } = await UpdateTicketService({
    ticketData,
    ticketId
  });

  if (ticketData.transf) {
    const { greetingMessage } = await ShowQueueService(ticketData.queueId);
    if (greetingMessage) {
      const msgtxt = formatBody(`\u200e${greetingMessage}`);
      await SendWhatsAppMessage({ body: msgtxt, ticket });
    }
  }

  if (ticket.status === "closed" && ticket.isGroup === false) {
    const whatsapp = await ShowWhatsAppService(ticket.whatsappId);

    const { farewellMessage } = whatsapp;

    if (farewellMessage) {
      await SendWhatsAppMessage({
        body: formatBody(`\u200e${farewellMessage}`, ticket),
        ticket
      });
    }
  }

  return res.status(200).json(ticket);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;

  const ticket = await DeleteTicketService(ticketId);

  const io = getIO();
  io.to(ticket.status).to(ticketId).to("notification").emit("ticket", {
    action: "delete",
    ticketId: +ticketId
  });

  return res.status(200).json({ message: "ticket deleted" });
};
