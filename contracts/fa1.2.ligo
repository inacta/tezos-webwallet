// Inspired by
// https://ide.ligolang.org/p/4n70T9Z_iDwy6hH2Y0b3Pw linked to from
// https://assets.tqtezos.com/docs/token-contracts/fa12/2-fa12-ligo/
// This is an implementation of the FA1.2 specification in PascaLIGO
// WARNING: this function might be susceptible to a Transfer/Approve attack. For more information, see:
// https://github.com/ecadlabs/token-contract-example/issues/6

type amt is nat;

type account is record
    balance : amt;
    allowances: map(address, amt);
end

type action is
| Transfer of (address * address * amt)
| Approve of (address * amt)
| GetAllowance of (address * address * contract(amt))
| GetBalance of (address * contract(amt))
| GetTotalSupply of (unit * contract(amt))
| Mint of amt
| Burn of amt

type contract_storage is record
  ledger: big_map(address, account);
  owner: address;
  totalSupply: amt;
end

function isAllowed ( const spender : address ; const value : amt ; var s : contract_storage) : bool is
  begin
    var allowed: bool := False;
    if Tezos.sender =/= Tezos.source then block {
      const src: account = case s.ledger[spender] of
        Some (acc) -> acc
        | None -> (failwith("NoAccount"): account)
      end;
      const allowanceAmount: amt = case src.allowances[Tezos.sender] of
        Some (allowance) -> allowance
        | None -> (failwith("NoAllowance"): amt)
      end;
      allowed := allowanceAmount >= value;
    };
    else allowed := True;
  end with allowed

function burn ( const value: amt ; var s : contract_storage ) : contract_storage is
 begin
  // We could let everyone burn as they can only burn their own tokens
  if Tezos.sender =/= s.owner then failwith("Only owner can burn");
  else skip;

  // Verify that caller has the sufficient balance to burn this amount
  // This *should* thrown if owner is not present in ledger, but get_force is deprecated
  // so we should probably use something else
  var ownerAccount := get_force(s.owner, s.ledger);
  if ownerAccount.balance < value then failwith("Insufficient balance to burn this amount");
  else skip;

  ownerAccount.balance := abs(ownerAccount.balance - value);
  s.ledger[s.owner] := ownerAccount;
  s.totalSupply := abs(s.totalSupply - value);

 end with s

function mint ( const value : amt ; var s : contract_storage ) : contract_storage is
 begin
  if Tezos.sender =/= s.owner then failwith("Only owner can mint");
  else skip;

  var ownerAccount: account := record
      balance = 0n;
      allowances = (map end : map(address, amt));
  end;
  case s.ledger[s.owner] of
      Some (acc) -> ownerAccount := acc
      | None -> skip
  end;

  // For some reason I couldn't get this to work with `abs`
  // Do I need to write back the value to s?
  ownerAccount.balance := ownerAccount.balance + value;
  s.ledger[s.owner] := ownerAccount;
  s.totalSupply := s.totalSupply + value;

 end with s

// Transfer a specific amount of tokens from the accountFrom address to a destination address
// Pre conditions:
//  The sender address is the account owner or is allowed to spend x in the name of accountFrom
//  The accountFrom account has a balance higher than amount
// Post conditions:
//  The balance of accountFrom is decreased by amount
//  The balance of destination is increased by amount
function transfer (const accountFrom : address ; const destination : address ; const value : amt ; var s : contract_storage) : contract_storage is
 begin
  // If accountFrom = destination transfer is not necessary
  if accountFrom = destination then skip;
  else block {
    // Is sender allowed to spend value in the name of source
    //case isAllowed(accountFrom, value, s) of
    //| False -> failwith ("Sender not allowed to spend token from source")
    //| True -> skip
    //end;
    const allowed = isAllowed(accountFrom, value, s);
    if allowed then skip;
    else failwith ("Sender not allowed to spend token from source");

    // Fetch src account
    const src: account = case s.ledger[accountFrom] of
       Some (acc) -> acc
      | None -> (failwith("NoAccount"): account)
    end;

    // Check that the source can spend that much
    if value > src.balance
    then failwith ("Source balance is too low");
    else skip;

    // Update the source balance
    // Using the abs function to convert int to nat
    src.balance := abs(src.balance - value);

    s.ledger[accountFrom] := src;

    // Fetch dst account or add empty dst account to ledger
    var dst: account := record
        balance = 0n;
        allowances = (map end : map(address, amt));
    end;
    case s.ledger[destination] of
      | None -> skip
      | Some(n) -> dst := n
    end;

    // Update the destination balance
    dst.balance := dst.balance + value;

    // Decrease the allowance amount if necessary
    if accountFrom =/= sender then block {
        const allowanceAmount: amt = case src.allowances[Tezos.sender] of
          Some (allowance) -> allowance
          | None -> (failwith("NoAllowance"): amt)
        end;
        if allowanceAmount - value < 0 then failwith ("Allowance amount cannot be negative");
        else src.allowances[Tezos.sender] := abs(allowanceAmount - value);
    } else skip;

    s.ledger[destination] := dst;
  }
 end with s

// Approve an amount to be spent by another address in the name of the sender
// Pre conditions:
//  The spender account is not the sender account
// Post conditions:
//  The allowance of spender in the name of sender is value
function approve (const spender : address ; const value : amt ; var s : contract_storage) : contract_storage is
 begin
  // If sender is the spender approving is not necessary
  if Tezos.sender = spender then skip;
  else block {
    const src: account = case s.ledger[Tezos.sender] of
       Some (acc) -> acc
      | None -> (failwith("NoAccount"): account)
    end;
    src.allowances[spender] := value;
    s.ledger[Tezos.sender] := src; // Not sure if this last step is necessary
  }
 end with s

// Note that the following three view functions are intended for contract-2-contract interaction,
// they are not like Ethereum's view functions which can run without writing to the blockchain.
// If you want to read a balance or another value from a deployed contract, you should read
// directly from memory.

// View function that forwards the allowance amount of spender in the name of tokenOwner to a contract
// Pre conditions:
//  None
// Post conditions:
//  The state is unchanged
function getAllowance (const owner : address ; const spender : address ; const contr : contract(amt) ; var s : contract_storage) : list(operation) is
 begin
  const src: account = case s.ledger[owner] of
    Some (acc) -> acc
    | None -> (failwith("NoAccount"): account)
  end;
  const destAllowance: amt = case src.allowances[spender] of
    Some (allowance) -> allowance
    | None -> (failwith("NoAllowance"): amt)
  end;
 end with list [transaction(destAllowance, 0tz, contr)]

// View function that forwards the balance of source to a contract
// Pre conditions:
//  None
// Post conditions:
//  The state is unchanged
function getBalance (const src : address ; const contr : contract(amt) ; var s : contract_storage) : list(operation) is
 begin
  const src: account = case s.ledger[src] of
    Some (acc) -> acc
    | None -> (failwith("NoAccount"): account)
  end;
 end with list [transaction(src.balance, 0tz, contr)]

// View function that forwards the totalSupply to a contract
// Pre conditions:
//  None
// Post conditions:
//  The state is unchanged
function getTotalSupply (const contr : contract(amt) ; var s : contract_storage) : list(operation) is
  list [transaction(s.totalSupply, 0tz, contr)]

function main (const p : action ; const s : contract_storage) :
  (list(operation) * contract_storage) is
 block {
   // Reject any transaction that try to transfer token to this contract
   if amount =/= 0tz then failwith ("This contract does not accept tezi deposits");
   else skip;
  } with case p of
  | Transfer(n) -> ((nil : list(operation)), transfer(n.0, n.1, n.2, s))
  | Approve(n) -> ((nil : list(operation)), approve(n.0, n.1, s))
  | Mint(n) -> ((nil : list(operation)), mint(n, s))
  | Burn(n) -> ((nil : list(operation)), burn(n, s))
  | GetAllowance(n) -> (getAllowance(n.0, n.1, n.2, s), s)
  | GetBalance(n) -> (getBalance(n.0, n.1, s), s)
  | GetTotalSupply(n) -> (getTotalSupply(n.1, s), s)
  end
