const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const ticketFacade = require('../services/TicketFacade');
const {
  createTicket,
  getMyTickets,
  getMyTicketById,
  getTicketActivity,     //New
  updateMyTicket,
  updateMyTicketStatus,  //New
  deleteMyTicket,
  getAllTickets,
  getAnyTicketById,
  updateAnyTicket,
  updateAnyTicketStatus, //New
  deleteAnyTicket,
} = require('../controllers/ticketController');
const { expect } = chai;
describe('Ticket Controller Tests', () => {
  afterEach(() => {
    sinon.restore();
  });
  describe('createTicket', () => {
    it('should create a ticket successfully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const req = {
        user: { id: userId },
        body: {
          subject: 'Printer not working',
          description: 'Office printer is offline',
          category: 'Hardware',
          priority: 'High',
        },
        file: { filename: 'printer.png' },
      };
      const createdTicket = {
        _id: new mongoose.Types.ObjectId(),
        user: userId,
        subject: req.body.subject,
        description: req.body.description,
        category: req.body.category,
        priority: req.body.priority,
        status: 'Open',
        image: '/uploads/printer.png',
      };
      // const createStub = sinon.stub(Ticket, 'create').resolves(createdTicket);
      const createStub = sinon.stub(ticketFacade, 'createTicket').resolves(createdTicket); //NEW
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await createTicket(req, res);
      // expect(createStub.calledOnceWith({
      //   user: userId,
      //   subject: 'Printer not working',
      //   description: 'Office printer is offline',
      //   category: 'Hardware',
      //   priority: 'High',
      //   image: '/uploads/printer.png',
      // })).to.be.true;
      expect(createStub.calledOnceWith(
        req.user,
        req.body,
        req.file
      )).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith(createdTicket)).to.be.true;
    });
    // it('should return 400 when subject or description is missing', async () => {
    //   const req = {
    //     user: { id: new mongoose.Types.ObjectId().toString() },
    //     body: {
    //       subject: '',
    //       description: '',
    //       category: '',  //New
    //     },
    //   };
    //   const res = {
    //     status: sinon.stub().returnsThis(),
    //     json: sinon.spy(),
    //   };
    //   await createTicket(req, res);
    //   expect(res.status.calledWith(400)).to.be.true;
    //   expect(
    //     res.json.calledWith({ message: 'Subject, description and category are required' })
    //   ).to.be.true;
    // });
    it('should return 400 when subject or description is missing', async () => {
      const req = {
        user: { id: new mongoose.Types.ObjectId().toString() },
        body: {
          subject: '',
          description: '',
          category: '',
        },
      };

      sinon
        .stub(ticketFacade, 'createTicket')
        .throws({
          statusCode: 400,
          message: 'Subject, description and category are required',
        });

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await createTicket(req, res);

      expect(res.status.calledWith(400)).to.be.true;

      expect(
        res.json.calledWith({
          message: 'Subject, description and category are required',
        })
      ).to.be.true;
    });
    it('should return 500 when create throws an error', async () => {
      const req = {
        user: { id: new mongoose.Types.ObjectId().toString() },
        body: {
          subject: 'Login issue',
          description: 'Cannot sign in',
          category: 'Account',
          priority: 'Medium',
        },
      };
      // sinon.stub(Ticket, 'create').throws(new Error('DB Error'));
      sinon.stub(ticketFacade, 'createTicket').throws(new Error('DB Error'));
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await createTicket(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
    });
  });
  describe('getMyTickets', () => {
    it('should return all tickets of the logged-in user', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const tickets = [
        { _id: new mongoose.Types.ObjectId(), subject: 'A', user: userId },
        { _id: new mongoose.Types.ObjectId(), subject: 'B', user: userId },
      ];
      const sortStub = sinon.stub().resolves(tickets);
      const findStub = sinon.stub(Ticket, 'find').returns({ sort: sortStub });
      const req = {
        user: { id: userId },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await getMyTickets(req, res);
      expect(findStub.calledOnceWith({ user: userId })).to.be.true;
      expect(sortStub.calledOnceWith({ createdAt: -1 })).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(tickets)).to.be.true;
    });
    it('should return 500 if getMyTickets fails', async () => {
      const sortStub = sinon.stub().throws(new Error('DB Error'));
      sinon.stub(Ticket, 'find').returns({ sort: sortStub });
      const req = {
        user: { id: new mongoose.Types.ObjectId().toString() },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await getMyTickets(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
    });
  });
  describe('getMyTicketById', () => {
    it('should return a ticket when it belongs to the logged-in user', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const ticketId = new mongoose.Types.ObjectId().toString();
      const ticket = {
        _id: ticketId,
        user: { toString: () => userId },
        subject: 'Email issue',
      };
      sinon.stub(Ticket, 'findById').resolves(ticket);
      const req = {
        params: { id: ticketId },
        user: { id: userId },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await getMyTicketById(req, res);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(ticket)).to.be.true;
    });
    it('should return 404 if ticket is not found', async () => {
      sinon.stub(Ticket, 'findById').resolves(null);
      const req = {
        params: { id: new mongoose.Types.ObjectId().toString() },
        user: { id: new mongoose.Types.ObjectId().toString() },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await getMyTicketById(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Ticket not found' })).to.be.true;
    });
    it('should return 403 if user tries to access another user’s ticket', async () => {
      const ticket = {
        user: { toString: () => 'owner-id' },
      };
      sinon.stub(Ticket, 'findById').resolves(ticket);
      const req = {
        params: { id: new mongoose.Types.ObjectId().toString() },
        user: { id: 'different-user-id' },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await getMyTicketById(req, res);
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: 'Access denied' })).to.be.true;
    });
  });
  // ++++++++++New+++++++++++++
  describe('getTicketActivity', () => {
    it('should return ticket activity successfully', async () => {
      const ticketId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const req = {
        params: { id: ticketId },
        user: { id: userId },
      };
      const logs = [
        {
          _id: new mongoose.Types.ObjectId(),
          ticket: ticketId,
          user: userId,
          role: 'user',
          action: 'Created',
          statusFrom: '',
          statusTo: 'Open',
          description: 'Ticket created',
        },
        {
          _id: new mongoose.Types.ObjectId(),
          ticket: ticketId,
          user: userId,
          role: 'admin',
          action: 'Status Updated',
          statusFrom: 'Open',
          statusTo: 'In Progress',
          description: 'Status changed to In Progress',
        },
      ];
      const activityStub = sinon
        .stub(ticketFacade, 'getTicketActivity')
        .resolves(logs);
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await getTicketActivity(req, res);
      expect(activityStub.calledOnceWith(ticketId, req.user)).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(logs)).to.be.true;
    });
    it('should return 500 when getTicketActivity throws an error', async () => {
      const ticketId = new mongoose.Types.ObjectId().toString();
      const req = {
        params: { id: ticketId },
        user: { id: new mongoose.Types.ObjectId().toString() },
      };
      sinon
        .stub(ticketFacade, 'getTicketActivity')
        .throws(new Error('DB Error'));
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await getTicketActivity(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
    });
  });
  // ++++++++++
  describe('updateMyTicket', () => {
    it('should update own ticket successfully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const ticketId = new mongoose.Types.ObjectId().toString();

      const req = {
        params: { id: ticketId },
        user: { id: userId },
        body: {
          subject: 'Updated subject',
          description: 'Updated description',
          category: 'Software',
          priority: 'High',
        },
        file: { filename: 'updated.png' },
      };

      const updatedTicket = {
        _id: ticketId,
        user: userId,
        subject: 'Updated subject',
        description: 'Updated description',
        category: 'Software',
        priority: 'High',
        image: '/uploads/updated.png',
      };

      const updateStub = sinon
        .stub(ticketFacade, 'updateMyTicket')
        .resolves(updatedTicket);

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await updateMyTicket(req, res);

      expect(updateStub.calledOnceWith(
        ticketId,
        req.user,
        req.body,
        req.file
      )).to.be.true;

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(updatedTicket)).to.be.true;
    });

    it('should return 404 if own ticket to update is not found', async () => {
      const req = {
        params: { id: new mongoose.Types.ObjectId().toString() },
        user: { id: new mongoose.Types.ObjectId().toString() },
        body: {},
      };

      sinon
        .stub(ticketFacade, 'updateMyTicket')
        .throws({ statusCode: 404, message: 'Ticket not found' });

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await updateMyTicket(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Ticket not found' })).to.be.true;
    });

    it('should return 403 if user tries to update another user’s ticket', async () => {
      const req = {
        params: { id: new mongoose.Types.ObjectId().toString() },
        user: { id: 'different-user-id' },
        body: {},
      };

      sinon
        .stub(ticketFacade, 'updateMyTicket')
        .throws({ statusCode: 403, message: 'Access denied' });

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await updateMyTicket(req, res);

      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: 'Access denied' })).to.be.true;
    });
  });
  // describe('updateMyTicket', () => {
  //   it('should update own ticket successfully', async () => {
  //     const userId = new mongoose.Types.ObjectId().toString();
  //     const ticketId = new mongoose.Types.ObjectId().toString();
  //     const savedTicket = {
  //       _id: ticketId,
  //       user: { toString: () => userId },
  //       subject: 'Old subject',
  //       description: 'Old description',
  //       category: 'Other',
  //       priority: 'Low',
  //       image: '',
  //       save: sinon.stub().resolvesThis(),
  //     };
  //     // sinon.stub(Ticket, 'findById').resolves(savedTicket);
  //     const updateStub = sinon.stub(ticketFacade, 'updateMyTicket').resolves(updatedTicket);
  //     const req = {
  //       params: { id: ticketId },
  //       user: { id: userId },
  //       body: {
  //         subject: 'Updated subject',
  //         description: 'Updated description',
  //         category: 'Software',
  //         priority: 'High',
  //       },
  //       file: { filename: 'updated.png' },
  //     };
  //     const res = {
  //       status: sinon.stub().returnsThis(),
  //       json: sinon.spy(),
  //     };
  //     await updateMyTicket(req, res);
  //     expect(savedTicket.subject).to.equal('Updated subject');
  //     expect(savedTicket.description).to.equal('Updated description');
  //     expect(savedTicket.category).to.equal('Software');
  //     expect(savedTicket.priority).to.equal('High');
  //     expect(savedTicket.image).to.equal('/uploads/updated.png');
  //     expect(savedTicket.save.calledOnce).to.be.true;
  //     expect(res.status.calledWith(200)).to.be.true;
  //     expect(res.json.calledOnce).to.be.true;
  //   });
  //   it('should return 404 if own ticket to update is not found', async () => {
  //     sinon.stub(Ticket, 'findById').resolves(null);
  //     const req = {
  //       params: { id: new mongoose.Types.ObjectId().toString() },
  //       user: { id: new mongoose.Types.ObjectId().toString() },
  //       body: {},
  //     };
  //     const res = {
  //       status: sinon.stub().returnsThis(),
  //       json: sinon.spy(),
  //     };
  //     await updateMyTicket(req, res);
  //     expect(res.status.calledWith(404)).to.be.true;
  //     expect(res.json.calledWith({ message: 'Ticket not found' })).to.be.true;
  //   });
  //   it('should return 403 if user tries to update another user’s ticket', async () => {
  //     const ticket = {
  //       user: { toString: () => 'owner-id' },
  //     };
  //     sinon.stub(Ticket, 'findById').resolves(ticket);
  //     const req = {
  //       params: { id: new mongoose.Types.ObjectId().toString() },
  //       user: { id: 'different-user-id' },
  //       body: {},
  //     };
  //     const res = {
  //       status: sinon.stub().returnsThis(),
  //       json: sinon.spy(),
  //     };
  //     await updateMyTicket(req, res);
  //     expect(res.status.calledWith(403)).to.be.true;
  //     expect(res.json.calledWith({ message: 'Access denied' })).to.be.true;
  //   });
  // });
  // ++++++++++New+++++++++++++
  describe('updateMyTicketStatus', () => {
    it('should update ticket status successfully', async () => {
      const ticketId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const req = {
        params: { id: ticketId },
        user: { id: userId },
        body: { status: 'In Progress' },
      };
      const updatedTicket = {
        _id: ticketId,
        user: userId,
        subject: 'Printer issue',
        status: 'In Progress',
      };
      const updateStub = sinon
        .stub(ticketFacade, 'updateMyTicketStatus')
        .resolves(updatedTicket);
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await updateMyTicketStatus(req, res);
      expect(
        updateStub.calledOnceWith(ticketId, req.user, 'In Progress')
      ).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(updatedTicket)).to.be.true;
    });
    it('should return 500 when updateMyTicketStatus throws an error', async () => {
      const ticketId = new mongoose.Types.ObjectId().toString();
      const req = {
        params: { id: ticketId },
        user: { id: new mongoose.Types.ObjectId().toString() },
        body: { status: 'Resolved' },
      };
      sinon
        .stub(ticketFacade, 'updateMyTicketStatus')
        .throws(new Error('DB Error'));
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await updateMyTicketStatus(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
    });
  });
  // +++++++++++++++++++++++
  describe('deleteMyTicket', () => {
    it('should delete own ticket successfully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const ticket = {
        user: { toString: () => userId },
        deleteOne: sinon.stub().resolves(),
      };
      sinon.stub(Ticket, 'findById').resolves(ticket);
      const req = {
        params: { id: new mongoose.Types.ObjectId().toString() },
        user: { id: userId },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await deleteMyTicket(req, res);
      expect(ticket.deleteOne.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(
        res.json.calledWith({ message: 'Ticket deleted successfully' })
      ).to.be.true;
    });
    it('should return 404 if own ticket to delete is not found', async () => {
      sinon.stub(Ticket, 'findById').resolves(null);
      const req = {
        params: { id: new mongoose.Types.ObjectId().toString() },
        user: { id: new mongoose.Types.ObjectId().toString() },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await deleteMyTicket(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Ticket not found' })).to.be.true;
    });
    it('should return 403 if user tries to delete another user’s ticket', async () => {
      const ticket = {
        user: { toString: () => 'owner-id' },
      };
      sinon.stub(Ticket, 'findById').resolves(ticket);
      const req = {
        params: { id: new mongoose.Types.ObjectId().toString() },
        user: { id: 'different-user-id' },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await deleteMyTicket(req, res);
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: 'Access denied' })).to.be.true;
    });
  });
  describe('getAllTickets', () => {
    it('should return all tickets for admin', async () => {
      const tickets = [
        { subject: 'Ticket 1' },
        { subject: 'Ticket 2' },
      ];
      const sortStub = sinon.stub().resolves(tickets);
      const populateStub = sinon.stub().returns({ sort: sortStub });
      const findStub = sinon.stub(Ticket, 'find').returns({ populate: populateStub });
      const req = {};
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await getAllTickets(req, res);
      expect(findStub.calledOnce).to.be.true;
      expect(populateStub.calledOnceWith('user', 'name email role')).to.be.true;
      expect(sortStub.calledOnceWith({ createdAt: -1 })).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(tickets)).to.be.true;
    });
  });
  describe('getAnyTicketById', () => {
    it('should return any ticket by id for admin', async () => {
      const ticket = { subject: 'Admin view ticket' };
      const populateStub = sinon.stub().resolves(ticket);
      const findByIdStub = sinon.stub(Ticket, 'findById').returns({ populate: populateStub });
      const req = {
        params: { id: new mongoose.Types.ObjectId().toString() },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await getAnyTicketById(req, res);
      expect(findByIdStub.calledOnceWith(req.params.id)).to.be.true;
      expect(populateStub.calledOnceWith('user', 'name email role')).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(ticket)).to.be.true;
    });
    it('should return 404 if admin ticket lookup fails to find ticket', async () => {
      const populateStub = sinon.stub().resolves(null);
      sinon.stub(Ticket, 'findById').returns({ populate: populateStub });
      const req = {
        params: { id: new mongoose.Types.ObjectId().toString() },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await getAnyTicketById(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Ticket not found' })).to.be.true;
    });
  });
  describe('updateAnyTicket', () => {
    it('should allow admin to update any ticket including status', async () => {
      const ticket = {
        subject: 'Old subject',
        description: 'Old description',
        category: 'Other',
        priority: 'Low',
        status: 'Open',
        image: '',
        save: sinon.stub().resolvesThis(),
      };
      sinon.stub(Ticket, 'findById').resolves(ticket);
      const req = {
        params: { id: new mongoose.Types.ObjectId().toString() },
        body: {
          subject: 'New subject',
          description: 'New description',
          category: 'Network',
          priority: 'High',
          status: 'Resolved',
        },
        file: { filename: 'admin-update.png' },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await updateAnyTicket(req, res);
      expect(ticket.subject).to.equal('New subject');
      expect(ticket.description).to.equal('New description');
      expect(ticket.category).to.equal('Network');
      expect(ticket.priority).to.equal('High');
      expect(ticket.status).to.equal('Resolved');
      expect(ticket.image).to.equal('/uploads/admin-update.png');
      expect(ticket.save.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
    });
    it('should return 404 if admin updates a non-existing ticket', async () => {
      sinon.stub(Ticket, 'findById').resolves(null);
      const req = {
        params: { id: new mongoose.Types.ObjectId().toString() },
        body: {},
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await updateAnyTicket(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Ticket not found' })).to.be.true;
    });
  });
  // +++++++++New+++++++++
  describe('updateAnyTicketStatus', () => {
    it('should update any ticket status successfully', async () => {
      const ticketId = new mongoose.Types.ObjectId().toString();
      const adminId = new mongoose.Types.ObjectId().toString();
      const req = {
        params: { id: ticketId },
        user: { id: adminId },
        body: { status: 'Resolved' },
      };
      const updatedTicket = {
        _id: ticketId,
        subject: 'Printer issue',
        status: 'Resolved',
      };
      const updateStub = sinon
        .stub(ticketFacade, 'updateAnyTicketStatus')
        .resolves(updatedTicket);
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await updateAnyTicketStatus(req, res);
      expect(
        updateStub.calledOnceWith(ticketId, req.user, 'Resolved')
      ).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(updatedTicket)).to.be.true;
    });
    it('should return 500 when updateAnyTicketStatus throws an error', async () => {
      const ticketId = new mongoose.Types.ObjectId().toString();
      const req = {
        params: { id: ticketId },
        user: { id: new mongoose.Types.ObjectId().toString() },
        body: { status: 'Closed' },
      };
      sinon
        .stub(ticketFacade, 'updateAnyTicketStatus')
        .throws(new Error('DB Error'));
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await updateAnyTicketStatus(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
    });
  });
  // ++++++++++++++++++
  describe('deleteAnyTicket', () => {
    it('should allow admin to delete any ticket', async () => {
      const ticket = {
        deleteOne: sinon.stub().resolves(),
      };
      sinon.stub(Ticket, 'findById').resolves(ticket);
      const req = {
        params: { id: new mongoose.Types.ObjectId().toString() },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await deleteAnyTicket(req, res);
      expect(ticket.deleteOne.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(
        res.json.calledWith({ message: 'Admin deleted ticket successfully' })
      ).to.be.true;
    });
    it('should return 404 if admin deletes a non-existing ticket', async () => {
      sinon.stub(Ticket, 'findById').resolves(null);
      const req = {
        params: { id: new mongoose.Types.ObjectId().toString() },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      await deleteAnyTicket(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Ticket not found' })).to.be.true;
    });
  });
});



// const chai = require('chai');
// const sinon = require('sinon');
// const mongoose = require('mongoose');
// const Ticket = require('../models/Ticket');
// const {
//   createTicket,
//   getMyTickets,
//   getMyTicketById,
//   updateMyTicket,
//   deleteMyTicket,
//   getAllTickets,
//   getAnyTicketById,
//   updateAnyTicket,
//   deleteAnyTicket,
// } = require('../controllers/ticketController');

// const { expect } = chai;

// describe('Ticket Controller Tests', () => {
//   afterEach(() => {
//     sinon.restore();
//   });

//   describe('createTicket', () => {
//     it('should create a ticket successfully', async () => {
//       const userId = new mongoose.Types.ObjectId().toString();

//       const req = {
//         user: { id: userId },
//         body: {
//           subject: 'Printer not working',
//           description: 'Office printer is offline',
//           category: 'Hardware',
//           priority: 'High',
//         },
//         file: { filename: 'printer.png' },
//       };

//       const createdTicket = {
//         _id: new mongoose.Types.ObjectId(),
//         user: userId,
//         subject: req.body.subject,
//         description: req.body.description,
//         category: req.body.category,
//         priority: req.body.priority,
//         status: 'Open',
//         image: '/uploads/printer.png',
//       };

//       const createStub = sinon.stub(Ticket, 'create').resolves(createdTicket);

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await createTicket(req, res);

//       expect(createStub.calledOnceWith({
//         user: userId,
//         subject: 'Printer not working',
//         description: 'Office printer is offline',
//         category: 'Hardware',
//         priority: 'High',
//         image: '/uploads/printer.png',
//       })).to.be.true;

//       expect(res.status.calledWith(201)).to.be.true;
//       expect(res.json.calledWith(createdTicket)).to.be.true;
//     });

//     it('should return 400 when subject or description is missing', async () => {
//       const req = {
//         user: { id: new mongoose.Types.ObjectId().toString() },
//         body: {
//           subject: '',
//           description: '',
//         },
//       };

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await createTicket(req, res);

//       expect(res.status.calledWith(400)).to.be.true;
//       expect(
//         res.json.calledWith({ message: 'Subject and description are required' })
//       ).to.be.true;
//     });

//     it('should return 500 when create throws an error', async () => {
//       const req = {
//         user: { id: new mongoose.Types.ObjectId().toString() },
//         body: {
//           subject: 'Login issue',
//           description: 'Cannot sign in',
//           category: 'Account',
//           priority: 'Medium',
//         },
//       };

//       sinon.stub(Ticket, 'create').throws(new Error('DB Error'));

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await createTicket(req, res);

//       expect(res.status.calledWith(500)).to.be.true;
//       expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
//     });
//   });

//   describe('getMyTickets', () => {
//     it('should return all tickets of the logged-in user', async () => {
//       const userId = new mongoose.Types.ObjectId().toString();

//       const tickets = [
//         { _id: new mongoose.Types.ObjectId(), subject: 'A', user: userId },
//         { _id: new mongoose.Types.ObjectId(), subject: 'B', user: userId },
//       ];

//       const sortStub = sinon.stub().resolves(tickets);
//       const findStub = sinon.stub(Ticket, 'find').returns({ sort: sortStub });

//       const req = {
//         user: { id: userId },
//       };

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await getMyTickets(req, res);

//       expect(findStub.calledOnceWith({ user: userId })).to.be.true;
//       expect(sortStub.calledOnceWith({ createdAt: -1 })).to.be.true;
//       expect(res.status.calledWith(200)).to.be.true;
//       expect(res.json.calledWith(tickets)).to.be.true;
//     });

//     it('should return 500 if getMyTickets fails', async () => {
//       const sortStub = sinon.stub().throws(new Error('DB Error'));
//       sinon.stub(Ticket, 'find').returns({ sort: sortStub });

//       const req = {
//         user: { id: new mongoose.Types.ObjectId().toString() },
//       };

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await getMyTickets(req, res);

//       expect(res.status.calledWith(500)).to.be.true;
//       expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
//     });
//   });

//   describe('getMyTicketById', () => {
//     it('should return a ticket when it belongs to the logged-in user', async () => {
//       const userId = new mongoose.Types.ObjectId().toString();
//       const ticketId = new mongoose.Types.ObjectId().toString();

//       const ticket = {
//         _id: ticketId,
//         user: { toString: () => userId },
//         subject: 'Email issue',
//       };

//       sinon.stub(Ticket, 'findById').resolves(ticket);

//       const req = {
//         params: { id: ticketId },
//         user: { id: userId },
//       };

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await getMyTicketById(req, res);

//       expect(res.status.calledWith(200)).to.be.true;
//       expect(res.json.calledWith(ticket)).to.be.true;
//     });

//     it('should return 404 if ticket is not found', async () => {
//       sinon.stub(Ticket, 'findById').resolves(null);

//       const req = {
//         params: { id: new mongoose.Types.ObjectId().toString() },
//         user: { id: new mongoose.Types.ObjectId().toString() },
//       };

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await getMyTicketById(req, res);

//       expect(res.status.calledWith(404)).to.be.true;
//       expect(res.json.calledWith({ message: 'Ticket not found' })).to.be.true;
//     });

//     it('should return 403 if user tries to access another user’s ticket', async () => {
//       const ticket = {
//         user: { toString: () => 'owner-id' },
//       };

//       sinon.stub(Ticket, 'findById').resolves(ticket);

//       const req = {
//         params: { id: new mongoose.Types.ObjectId().toString() },
//         user: { id: 'different-user-id' },
//       };

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await getMyTicketById(req, res);

//       expect(res.status.calledWith(403)).to.be.true;
//       expect(res.json.calledWith({ message: 'Access denied' })).to.be.true;
//     });
//   });

//   describe('updateMyTicket', () => {
//     it('should update own ticket successfully', async () => {
//       const userId = new mongoose.Types.ObjectId().toString();
//       const ticketId = new mongoose.Types.ObjectId().toString();

//       const savedTicket = {
//         _id: ticketId,
//         user: { toString: () => userId },
//         subject: 'Old subject',
//         description: 'Old description',
//         category: 'Other',
//         priority: 'Low',
//         image: '',
//         save: sinon.stub().resolvesThis(),
//       };

//       sinon.stub(Ticket, 'findById').resolves(savedTicket);

//       const req = {
//         params: { id: ticketId },
//         user: { id: userId },
//         body: {
//           subject: 'Updated subject',
//           description: 'Updated description',
//           category: 'Software',
//           priority: 'High',
//         },
//         file: { filename: 'updated.png' },
//       };

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await updateMyTicket(req, res);

//       expect(savedTicket.subject).to.equal('Updated subject');
//       expect(savedTicket.description).to.equal('Updated description');
//       expect(savedTicket.category).to.equal('Software');
//       expect(savedTicket.priority).to.equal('High');
//       expect(savedTicket.image).to.equal('/uploads/updated.png');
//       expect(savedTicket.save.calledOnce).to.be.true;
//       expect(res.status.calledWith(200)).to.be.true;
//       expect(res.json.calledOnce).to.be.true;
//     });

//     it('should return 404 if own ticket to update is not found', async () => {
//       sinon.stub(Ticket, 'findById').resolves(null);

//       const req = {
//         params: { id: new mongoose.Types.ObjectId().toString() },
//         user: { id: new mongoose.Types.ObjectId().toString() },
//         body: {},
//       };

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await updateMyTicket(req, res);

//       expect(res.status.calledWith(404)).to.be.true;
//       expect(res.json.calledWith({ message: 'Ticket not found' })).to.be.true;
//     });

//     it('should return 403 if user tries to update another user’s ticket', async () => {
//       const ticket = {
//         user: { toString: () => 'owner-id' },
//       };

//       sinon.stub(Ticket, 'findById').resolves(ticket);

//       const req = {
//         params: { id: new mongoose.Types.ObjectId().toString() },
//         user: { id: 'different-user-id' },
//         body: {},
//       };

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await updateMyTicket(req, res);

//       expect(res.status.calledWith(403)).to.be.true;
//       expect(res.json.calledWith({ message: 'Access denied' })).to.be.true;
//     });
//   });

//   describe('deleteMyTicket', () => {
//     it('should delete own ticket successfully', async () => {
//       const userId = new mongoose.Types.ObjectId().toString();

//       const ticket = {
//         user: { toString: () => userId },
//         deleteOne: sinon.stub().resolves(),
//       };

//       sinon.stub(Ticket, 'findById').resolves(ticket);

//       const req = {
//         params: { id: new mongoose.Types.ObjectId().toString() },
//         user: { id: userId },
//       };

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await deleteMyTicket(req, res);

//       expect(ticket.deleteOne.calledOnce).to.be.true;
//       expect(res.status.calledWith(200)).to.be.true;
//       expect(
//         res.json.calledWith({ message: 'Ticket deleted successfully' })
//       ).to.be.true;
//     });

//     it('should return 404 if own ticket to delete is not found', async () => {
//       sinon.stub(Ticket, 'findById').resolves(null);

//       const req = {
//         params: { id: new mongoose.Types.ObjectId().toString() },
//         user: { id: new mongoose.Types.ObjectId().toString() },
//       };

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await deleteMyTicket(req, res);

//       expect(res.status.calledWith(404)).to.be.true;
//       expect(res.json.calledWith({ message: 'Ticket not found' })).to.be.true;
//     });

//     it('should return 403 if user tries to delete another user’s ticket', async () => {
//       const ticket = {
//         user: { toString: () => 'owner-id' },
//       };

//       sinon.stub(Ticket, 'findById').resolves(ticket);

//       const req = {
//         params: { id: new mongoose.Types.ObjectId().toString() },
//         user: { id: 'different-user-id' },
//       };

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await deleteMyTicket(req, res);

//       expect(res.status.calledWith(403)).to.be.true;
//       expect(res.json.calledWith({ message: 'Access denied' })).to.be.true;
//     });
//   });

//   describe('getAllTickets', () => {
//     it('should return all tickets for admin', async () => {
//       const tickets = [
//         { subject: 'Ticket 1' },
//         { subject: 'Ticket 2' },
//       ];

//       const sortStub = sinon.stub().resolves(tickets);
//       const populateStub = sinon.stub().returns({ sort: sortStub });
//       const findStub = sinon.stub(Ticket, 'find').returns({ populate: populateStub });

//       const req = {};
//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await getAllTickets(req, res);

//       expect(findStub.calledOnce).to.be.true;
//       expect(populateStub.calledOnceWith('user', 'name email role')).to.be.true;
//       expect(sortStub.calledOnceWith({ createdAt: -1 })).to.be.true;
//       expect(res.status.calledWith(200)).to.be.true;
//       expect(res.json.calledWith(tickets)).to.be.true;
//     });
//   });

//   describe('getAnyTicketById', () => {
//     it('should return any ticket by id for admin', async () => {
//       const ticket = { subject: 'Admin view ticket' };

//       const populateStub = sinon.stub().resolves(ticket);
//       const findByIdStub = sinon.stub(Ticket, 'findById').returns({ populate: populateStub });

//       const req = {
//         params: { id: new mongoose.Types.ObjectId().toString() },
//       };

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await getAnyTicketById(req, res);

//       expect(findByIdStub.calledOnceWith(req.params.id)).to.be.true;
//       expect(populateStub.calledOnceWith('user', 'name email role')).to.be.true;
//       expect(res.status.calledWith(200)).to.be.true;
//       expect(res.json.calledWith(ticket)).to.be.true;
//     });

//     it('should return 404 if admin ticket lookup fails to find ticket', async () => {
//       const populateStub = sinon.stub().resolves(null);
//       sinon.stub(Ticket, 'findById').returns({ populate: populateStub });

//       const req = {
//         params: { id: new mongoose.Types.ObjectId().toString() },
//       };

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await getAnyTicketById(req, res);

//       expect(res.status.calledWith(404)).to.be.true;
//       expect(res.json.calledWith({ message: 'Ticket not found' })).to.be.true;
//     });
//   });

//   describe('updateAnyTicket', () => {
//     it('should allow admin to update any ticket including status', async () => {
//       const ticket = {
//         subject: 'Old subject',
//         description: 'Old description',
//         category: 'Other',
//         priority: 'Low',
//         status: 'Open',
//         image: '',
//         save: sinon.stub().resolvesThis(),
//       };

//       sinon.stub(Ticket, 'findById').resolves(ticket);

//       const req = {
//         params: { id: new mongoose.Types.ObjectId().toString() },
//         body: {
//           subject: 'New subject',
//           description: 'New description',
//           category: 'Network',
//           priority: 'High',
//           status: 'Resolved',
//         },
//         file: { filename: 'admin-update.png' },
//       };

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await updateAnyTicket(req, res);

//       expect(ticket.subject).to.equal('New subject');
//       expect(ticket.description).to.equal('New description');
//       expect(ticket.category).to.equal('Network');
//       expect(ticket.priority).to.equal('High');
//       expect(ticket.status).to.equal('Resolved');
//       expect(ticket.image).to.equal('/uploads/admin-update.png');
//       expect(ticket.save.calledOnce).to.be.true;
//       expect(res.status.calledWith(200)).to.be.true;
//       expect(res.json.calledOnce).to.be.true;
//     });

//     it('should return 404 if admin updates a non-existing ticket', async () => {
//       sinon.stub(Ticket, 'findById').resolves(null);

//       const req = {
//         params: { id: new mongoose.Types.ObjectId().toString() },
//         body: {},
//       };

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await updateAnyTicket(req, res);

//       expect(res.status.calledWith(404)).to.be.true;
//       expect(res.json.calledWith({ message: 'Ticket not found' })).to.be.true;
//     });
//   });

//   describe('deleteAnyTicket', () => {
//     it('should allow admin to delete any ticket', async () => {
//       const ticket = {
//         deleteOne: sinon.stub().resolves(),
//       };

//       sinon.stub(Ticket, 'findById').resolves(ticket);

//       const req = {
//         params: { id: new mongoose.Types.ObjectId().toString() },
//       };

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await deleteAnyTicket(req, res);

//       expect(ticket.deleteOne.calledOnce).to.be.true;
//       expect(res.status.calledWith(200)).to.be.true;
//       expect(
//         res.json.calledWith({ message: 'Admin deleted ticket successfully' })
//       ).to.be.true;
//     });

//     it('should return 404 if admin deletes a non-existing ticket', async () => {
//       sinon.stub(Ticket, 'findById').resolves(null);

//       const req = {
//         params: { id: new mongoose.Types.ObjectId().toString() },
//       };

//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.spy(),
//       };

//       await deleteAnyTicket(req, res);

//       expect(res.status.calledWith(404)).to.be.true;
//       expect(res.json.calledWith({ message: 'Ticket not found' })).to.be.true;
//     });
//   });
// });