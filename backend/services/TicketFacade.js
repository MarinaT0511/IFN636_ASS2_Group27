const Ticket = require('../models/Ticket');
const TicketActivityLog = require('../models/TicketActivityLog');
const TicketFactory = require('./ticketFactory/TicketFactory');
const TicketStatusContext = require('./ticketStates/TicketStatusContext');

const {
  UserTicketAccessStrategy,
  AdminTicketAccessStrategy,
} = require('./ticketStrategies/TicketAccessStrategy');

const TicketEventManager = require('./observers/TicketEventManager');
const ActivityLogObserver = require('./observers/ActivityLogObserver');
const NotificationObserver = require('./observers/NotificationObserver');
const ConsoleLogObserver = require('./observers/ConsoleLogObserver');

class TicketFacade {
  constructor() {
    this.userStrategy = new UserTicketAccessStrategy();
    this.adminStrategy = new AdminTicketAccessStrategy();
    this.statusContext = new TicketStatusContext();

    this.eventManager = new TicketEventManager();

    // Disable database-writing observers during unit/functional tests.
    // This prevents TicketActivityLog.create() from trying to use a real MongoDB
    // connection when controller tests are using sinon stubs.
    if (process.env.NODE_ENV !== 'test') {
      this.eventManager.subscribe(new ActivityLogObserver());
      this.eventManager.subscribe(new NotificationObserver());
    }

    this.eventManager.subscribe(new ConsoleLogObserver());
  }

  getImagePath(file) {
    return file ? `/uploads/${file.filename}` : '';
  }

  applyEditableFields(ticket, body, file) {
    if (body.subject !== undefined) {
      ticket.subject = body.subject;
    }

    if (body.description !== undefined) {
      ticket.description = body.description;
    }

    if (body.category !== undefined) {
      ticket.category = TicketFactory.getSafeCategory(body.category);
    }

    if (body.priority !== undefined) {
      ticket.priority = TicketFactory.getSafePriority(body.priority, ticket.category);
    }

    if (file) {
      ticket.image = this.getImagePath(file);
    }

    return ticket;
  }

  async createTicket(user, body, file) {
    const ticketData = TicketFactory.createTicketData({
      user: user.id,
      subject: body.subject,
      description: body.description,
      category: body.category,
      priority: body.priority,
      image: this.getImagePath(file),
    });

    const ticket = await Ticket.create(ticketData);

    await this.eventManager.notify('ticket.created', {
      ticket,
      user,
      description: 'A new support ticket was created',
    });

    return ticket;
  }

  async getMyTickets(user) {
    return this.userStrategy.getTickets(user);
  }

  async getMyTicketById(ticketId, user) {
    return this.userStrategy.getTicketById(ticketId, user);
  }

  async getTicketActivity(ticketId, user) {
    if (user.role === 'admin') {
      await this.adminStrategy.getEditableTicketById(ticketId);
    } else {
      await this.userStrategy.getTicketById(ticketId, user);
    }

    return TicketActivityLog.find({ ticket: ticketId })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });
  }

  async updateMyTicket(ticketId, user, body, file) {
    const ticket = await this.userStrategy.getTicketById(ticketId, user);

    this.applyEditableFields(ticket, body, file);

    const updatedTicket = await ticket.save();

    await this.eventManager.notify('ticket.updated', {
      ticket: updatedTicket,
      user,
      description: 'A user updated their own ticket',
    });

    return updatedTicket;
  }

  async updateMyTicketStatus(ticketId, user, nextStatus) {
    const ticket = await this.userStrategy.getTicketById(ticketId, user);
    const oldStatus = ticket.status;

    this.statusContext.changeStatus(ticket, nextStatus);

    const updatedTicket = await ticket.save();

    await this.eventManager.notify('ticket.status_changed', {
      ticket: updatedTicket,
      user,
      statusFrom: oldStatus,
      statusTo: updatedTicket.status,
      description: `Ticket status changed from ${oldStatus} to ${updatedTicket.status}`,
    });

    return updatedTicket;
  }

  async deleteMyTicket(ticketId, user) {
    const ticket = await this.userStrategy.getTicketById(ticketId, user);
    const ticketIdForLog = ticket._id;

    await ticket.deleteOne();

    await this.eventManager.notify('ticket.deleted', {
      ticketId: ticketIdForLog,
      user,
      description: 'A user deleted their own ticket',
    });
  }

  async getAllTickets() {
    return this.adminStrategy.getTickets();
  }

  async getAnyTicketById(ticketId) {
    return this.adminStrategy.getTicketById(ticketId);
  }

  async updateAnyTicket(ticketId, user, body, file) {
    const ticket = await this.adminStrategy.getEditableTicketById(ticketId);
    const oldStatus = ticket.status;

    this.applyEditableFields(ticket, body, file);

    if (body.status !== undefined) {
      this.statusContext.changeStatus(ticket, body.status);
    }

    const updatedTicket = await ticket.save();

    await this.eventManager.notify('ticket.admin_updated', {
      ticket: updatedTicket,
      user,
      statusFrom: oldStatus,
      statusTo: updatedTicket.status,
      description: 'An admin updated a ticket',
    });

    return updatedTicket;
  }

  async updateAnyTicketStatus(ticketId, user, nextStatus) {
    const ticket = await this.adminStrategy.getEditableTicketById(ticketId);
    const oldStatus = ticket.status;

    this.statusContext.changeStatus(ticket, nextStatus);

    const updatedTicket = await ticket.save();

    await this.eventManager.notify('ticket.admin_status_changed', {
      ticket: updatedTicket,
      user,
      statusFrom: oldStatus,
      statusTo: updatedTicket.status,
      description: `Admin changed ticket status from ${oldStatus} to ${updatedTicket.status}`,
    });

    return updatedTicket;
  }

  async deleteAnyTicket(ticketId, user) {
    const ticket = await this.adminStrategy.getEditableTicketById(ticketId);
    const ticketIdForLog = ticket._id;

    await ticket.deleteOne();

    await this.eventManager.notify('ticket.admin_deleted', {
      ticketId: ticketIdForLog,
      user,
      description: 'An admin deleted a ticket',
    });
  }
}

module.exports = new TicketFacade();